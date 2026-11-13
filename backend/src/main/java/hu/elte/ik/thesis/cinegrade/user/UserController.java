package hu.elte.ik.thesis.cinegrade.user;

import hu.elte.ik.thesis.cinegrade.auth.RefreshCookieFactory;
import hu.elte.ik.thesis.cinegrade.post.PostService;
import hu.elte.ik.thesis.cinegrade.post.dto.PostSummaryResponse;
import hu.elte.ik.thesis.cinegrade.session.ClientType;
import org.springframework.data.web.PagedModel;
import hu.elte.ik.thesis.cinegrade.auth.dto.AuthenticationResponse;
import hu.elte.ik.thesis.cinegrade.auth.dto.LoginResponse;
import hu.elte.ik.thesis.cinegrade.user.dto.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("users")
@RequiredArgsConstructor
@Tag(name = "Users")
public class UserController {

    private final UserService userService;
    private final RefreshCookieFactory refreshCookie;
    // [AI-GENERATED]
    private final PostService postService;

    // Public: viewer is null when nobody is logged in
    @GetMapping("/{username}")
    public ResponseEntity<PublicUserProfileResponse> getPublicProfile(@PathVariable String username,
                                                                      @AuthenticationPrincipal User viewer) {
        return ResponseEntity.ok()
                .body(userService.getPublicUserProfile(username, viewer));
    }

    // Creates the vote, or changes it if the viewer already rated this user
    @PutMapping("/{username}/rating")
    public ResponseEntity<Void> rateUser(@PathVariable String username,
                                         @RequestBody @Valid RateUserRequest request,
                                         @AuthenticationPrincipal User rater) {
        userService.rateUser(rater, username, request.stars());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{username}/rating")
    public ResponseEntity<Void> removeRating(@PathVariable String username,
                                             @AuthenticationPrincipal User rater) {
        userService.removeRating(rater, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse>getMyUserProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok().body(userService.getOwnProfile(user.getEmail()));
    }

    @GetMapping("/me/saved")
    public ResponseEntity<PagedModel<PostSummaryResponse>> getSavedPosts(@AuthenticationPrincipal User user,
                                                                         @RequestParam(defaultValue = "0") int page,
                                                                         @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(postService.saved(user, page, size));
    }

    @PutMapping("/me/username")
    public ResponseEntity<AuthenticationResponse> changeUsername(@AuthenticationPrincipal User user,
                                                                 @RequestBody @Valid ChangeUsernameRequest request) {
        String jwt = userService.changeUsername(user, request);
        return ResponseEntity.ok(AuthenticationResponse.builder().token(jwt).build());
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> changeAvatar(@AuthenticationPrincipal User user,
                                                            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(userService.changeAvatar(user, file));
    }

    @PatchMapping("/me/description")
    public ResponseEntity<UserProfileResponse> changeDescription(@AuthenticationPrincipal User user,
                                                                 @RequestBody @Valid UpdateDescriptionRequest request) {
        return ResponseEntity.ok(userService.changeDescription(user, request));
    }

    // Logs out every other device: all sessions are revoked and this one gets a new JWT and refresh cookie
    @PutMapping("/me/password")
    public ResponseEntity<AuthenticationResponse> changePassword(@AuthenticationPrincipal User user,
                                                                 @RequestBody @Valid ChangePasswordRequest request,
                                                                 // [AI-GENERATED] keeps the new session's client (web or desktop app)
                                                                 @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        LoginResponse result = userService.changePassword(user, request, ClientType.from(userAgent));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.create(result.refreshToken()))
                .body(AuthenticationResponse.builder().token(result.jwt()).build());
    }

    @PutMapping("/{username}/follow")
    public ResponseEntity<Void> followUser(@AuthenticationPrincipal User currentUser,
                                            @PathVariable String username) {
        userService.followUser(currentUser.getUsername(), username);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{username}/follow")
    public ResponseEntity<Void> unfollowUser(@AuthenticationPrincipal User currentUser,
                                              @PathVariable String username) {
        userService.unfollowUser(currentUser.getUsername(), username);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/links")
    public ResponseEntity<UserProfileResponse> changeLinks(@AuthenticationPrincipal User user,
                                                           @RequestBody @Valid UpdateLinksRequest request) {
        return ResponseEntity.ok(userService.changeLinks(user, request));
    }
}
