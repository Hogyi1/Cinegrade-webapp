package hu.elte.ik.thesis.cinegrade.user;

import hu.elte.ik.thesis.cinegrade.auth.dto.LoginResponse;
import hu.elte.ik.thesis.cinegrade.files.FileStorageService;
import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import hu.elte.ik.thesis.cinegrade.handler.BusinessErrorCodes;
import hu.elte.ik.thesis.cinegrade.handler.BusinessException;
import hu.elte.ik.thesis.cinegrade.post.PostRepository;
import hu.elte.ik.thesis.cinegrade.rating.Rating;
import hu.elte.ik.thesis.cinegrade.rating.RatingRepository;
import hu.elte.ik.thesis.cinegrade.rating.RatingSummary;
import hu.elte.ik.thesis.cinegrade.security.JwtService;
import hu.elte.ik.thesis.cinegrade.session.ClientType;
import hu.elte.ik.thesis.cinegrade.session.SessionService;
import hu.elte.ik.thesis.cinegrade.user.dto.*;
import hu.elte.ik.thesis.cinegrade.user.follow.Follow;
import hu.elte.ik.thesis.cinegrade.user.follow.FollowRepository;
import hu.elte.ik.thesis.cinegrade.user.follow.FollowSummary;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    // Used by getOwnProfile and the USERNAME_CHANGE_TOO_SOON check in changeUsername
    public static final Duration USERNAME_CHANGE_COOLDOWN = Duration.ofDays(3);

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FileStorageService fileStorageService;
    private final RatingRepository ratingRepository;
    private final FollowRepository followRepository;
    private final SessionService sessionService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Someone's public profile. viewer is null when nobody is logged in;
     * otherwise myRating is the stars the viewer gave this user.
     */
    @Transactional(readOnly = true)
    public PublicUserProfileResponse getPublicUserProfile(String username, User viewer) {
        User u = userRepository.findUserByUsername(username.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (!u.isEnabled() || !u.isAccountNonLocked()) {
            throw new BusinessException(BusinessErrorCodes.USER_DEACTIVATED);
        }
        RatingSummary ratingSummary = ratingRepository.findSummaryByRatedId(u.getId());
        FollowSummary followSummary = followRepository.findSummaryByUserId(u.getId());
        Boolean following = viewer == null ? null
                : followRepository.existsByFollowedIdAndFollowerId(u.getId(), viewer.getId());

        Short myRating = viewer == null ? null
                : ratingRepository.findByRaterIdAndRatedId(viewer.getId(), u.getId())
                .map(Rating::getStars).orElse(null);
        return PublicUserProfileResponse.builder()
                .username(u.getUsername())
                .description(u.getDescription())
                .avatarFileId(avatarIdOf(u))
                .averageRating(ratingSummary.average())
                .ratingCount(ratingSummary.count())
                .myRating(myRating)
                .followerCount(followSummary.followerCount())
                .followingCount(followSummary.followingCount())
                .postCount(postRepository.countByUserId(u.getId()))              // postRepository.countByUserId(u.getId()) once posts exist
                .following(following)
                .links(List.copyOf(u.getLinks()))           // the user's links once that field exists
                .build();
    }

    /**
     * The logged-in user's own profile (GET /users/me).
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getOwnProfile(String email) {
        User u = userRepository.findUserByEmail(email.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));
        RatingSummary rating = ratingRepository.findSummaryByRatedId(u.getId());
        FollowSummary follow = followRepository.findSummaryByUserId(u.getId());

        LocalDateTime next = u.getUsernameChangedAt() == null ? null
                : u.getUsernameChangedAt().plus(USERNAME_CHANGE_COOLDOWN);
        if (next != null && !next.isAfter(LocalDateTime.now())) {
            next = null;
        }

        return UserProfileResponse
                .builder()
                .username(u.getUsername())
                .email(u.getEmail())
                .description(u.getDescription())
                .avatarFileId(avatarIdOf(u))
                .nextUsernameChangeAt(next)
                .averageRating(rating.average())
                .ratingCount(rating.count())
                .followerCount(follow.followerCount())
                .followingCount(follow.followingCount())
                .postCount(postRepository.countByUserId(u.getId()))
                .links(List.copyOf(u.getLinks()))
                .build();
    }

    private static Long avatarIdOf(User u) {
        return u.getAvatarFile() == null ? null : u.getAvatarFile().getId();
    }

    /**
     * Creates the rater's vote for this user, or updates it if one exists.
     */
    @Transactional
    public void rateUser(User rater, String username, short stars) {
        User u = userRepository.findUserByEmail(rater.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        User ratedUser = userRepository.findUserByUsername(username.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (!ratedUser.isEnabled() || !ratedUser.isAccountNonLocked()) {
            throw new BusinessException(BusinessErrorCodes.USER_DEACTIVATED);
        }
        if (Objects.equals(u.getId(), ratedUser.getId())) {
            throw new BusinessException(BusinessErrorCodes.CANNOT_RATE_SELF);
        }

        ratingRepository.findByRaterIdAndRatedId(u.getId(), ratedUser.getId())
                .ifPresentOrElse(
                        existing -> existing.setStars(stars), // managed entity: saved when the transaction commits
                        () -> ratingRepository.save(Rating.builder()
                                .rated(ratedUser)
                                .rater(u)
                                .stars(stars)
                                .build()));
    }

    /**
     * Removes the rater's vote for this user, if there is one.
     */
    @Transactional
    public void removeRating(User rater, String username) {
        User u = userRepository.findUserByEmail(rater.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        User ratedUser = userRepository.findUserByUsername(username.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        ratingRepository.findByRaterIdAndRatedId(u.getId(), ratedUser.getId()).ifPresent(ratingRepository::delete);
    }

    /**
     * Allowed once per USERNAME_CHANGE_COOLDOWN (USERNAME_CHANGE_TOO_SOON); fails with USERNAME_TAKEN if someone has it.
     * Returns a new JWT so the "username" claim the frontend sees is up to date.
     */
    @Transactional
    public String changeUsername(User user, ChangeUsernameRequest request) {
        User u = userRepository.findUserByEmail(user.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        LocalDateTime next = u.getUsernameChangedAt() == null ? null
                : u.getUsernameChangedAt().plus(USERNAME_CHANGE_COOLDOWN);

        if (next != null && next.isAfter(LocalDateTime.now())){
            throw new BusinessException(BusinessErrorCodes.USERNAME_CHANGE_TOO_SOON);
        }

        if (userRepository.existsUserByUsername(request.getUsername().toLowerCase(Locale.ROOT))) {
            throw new BusinessException(BusinessErrorCodes.USERNAME_TAKEN);
        }

        u.setUsername(request.getUsername().toLowerCase(Locale.ROOT));
        u.setUsernameChangedAt(LocalDateTime.now());
        userRepository.save(u);

        return jwtService.generateToken(Map.of("username", u.getUsername()), u);
    }

    /**
     * Stores the image through FileStorageService and points user.avatarFile at it.
     */
    @Transactional
    public UserProfileResponse changeAvatar(User user, MultipartFile file) {
        User u = userRepository.findUserByEmail(user.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        StoredFile oldAvatar = u.getAvatarFile();
        try {
            StoredFile storedFile = fileStorageService.storeAvatar(file, u);
            u.setAvatarFile(storedFile);
            userRepository.save(u);
        } catch (IOException e) {
            throw new BusinessException(BusinessErrorCodes.AVATAR_UPLOAD_FAILED);
        }
        // Row goes now, the file on disk only after the commit (see FileStorageService.delete)
        if (oldAvatar != null) {
            fileStorageService.delete(oldAvatar);
        }
        return getOwnProfile(u.getEmail());
    }

    @Transactional
    public UserProfileResponse changeDescription(User user, UpdateDescriptionRequest request) {
        User u = userRepository.findUserByEmail(user.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        u.setDescription(request.getDescription());
        userRepository.save(u);
        return getOwnProfile(u.getEmail());
    }

    /**
     * INCORRECT_CURRENT_PASSWORD if currentPassword is wrong,
     * NEW_PASSWORD_DOES_NOT_MATCH if newPassword != confirmPassword.
     */
    @Transactional
    public LoginResponse changePassword(User user, ChangePasswordRequest request) {
        User u = userRepository.findUserByEmail(user.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), u.getPassword())) {
            throw new BusinessException(BusinessErrorCodes.INCORRECT_CURRENT_PASSWORD);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(BusinessErrorCodes.NEW_PASSWORD_DOES_NOT_MATCH);
        }

        u.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(u);

        sessionService.revokeAll(u);
        String jwt = jwtService.generateToken(Map.of("username", u.getUsername()), u);
        return new LoginResponse(jwt, sessionService.create(u, ClientType.WEB, null));
    }

    public List<UserSummaryResponse> searchUsers(String query) {
        // Escape LIKE wildcards so typing % or _ doesn't match everyone
        String escaped = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return userRepository.searchByPrefix(escaped, PageRequest.of(0, 10));
    }

    @Transactional
    public void followUser(String currentUsername, String username) {
        User followedUser = userRepository.findUserByUsername(username.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));
        User currentUser = userRepository.findUserByUsername(currentUsername)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        if (!followedUser.isEnabled() || !followedUser.isAccountNonLocked()) {
            throw new BusinessException(BusinessErrorCodes.USER_DEACTIVATED);
        }
        if (currentUser.getId().equals(followedUser.getId())) {
            throw new BusinessException(BusinessErrorCodes.CANNOT_FOLLOW_SELF);
        }
        if (followRepository.existsByFollowedIdAndFollowerId(followedUser.getId(), currentUser.getId())) {
            return;
        }
        followRepository.save(Follow.builder().follower(currentUser).followed(followedUser).build());
    }
    @Transactional
    public void unfollowUser(String currentUsername, String username) {
        // [AI-GENERATED] Lowercased like everywhere else: usernames are stored in lowercase
        User followedUser = userRepository.findUserByUsername(username.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        User currentUser = userRepository.findUserByUsername(currentUsername)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));

        followRepository.deleteByFollowerIdAndFollowedId(currentUser.getId(), followedUser.getId());
    }

    @Transactional
    public UserProfileResponse changeLinks(User user, UpdateLinksRequest request) {
        User u = userRepository.findUserByEmail(user.getEmail().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.USER_NOT_FOUND));
        u.getLinks().clear();                       // keep the same list so Hibernate tracks it
        u.getLinks().addAll(request.links().stream().map(String::trim).toList());
        return getOwnProfile(u.getEmail());
    }
}
