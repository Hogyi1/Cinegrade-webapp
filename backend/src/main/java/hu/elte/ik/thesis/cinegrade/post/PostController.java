package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.FileDownload;
import hu.elte.ik.thesis.cinegrade.files.FileType;
import hu.elte.ik.thesis.cinegrade.post.dto.CreatePostRequest;
import hu.elte.ik.thesis.cinegrade.post.dto.PostDetailResponse;
import hu.elte.ik.thesis.cinegrade.post.dto.PostSummaryResponse;
import hu.elte.ik.thesis.cinegrade.post.dto.UpdatePostRequest;
import hu.elte.ik.thesis.cinegrade.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

// [AI-GENERATED] Every endpoint wired to its PostService method; only download was here before.
@RestController
@RequestMapping("posts")
@RequiredArgsConstructor
@Tag(name = "Posts")
public class PostController {

    private final PostService postService;

    // Text fields and files in one multipart form: title, description, tags (repeated), before, after, lut, cgedit
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDetailResponse> createPost(@AuthenticationPrincipal User author,
                                                         @ModelAttribute @Valid CreatePostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.create(author, request));
    }

    // Public: viewer is null when nobody is logged in
    @GetMapping
    public ResponseEntity<PagedModel<PostSummaryResponse>> listPosts(@AuthenticationPrincipal User viewer,
                                                                     @RequestParam(required = false) String author,
                                                                     @RequestParam(defaultValue = "all") String scope,
                                                                     @RequestParam(required = false) String tag,
                                                                     @RequestParam(defaultValue = "new") String sort,
                                                                     @RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(postService.list(viewer, author, scope, tag, sort, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDetailResponse> getPost(@PathVariable Integer id,
                                                      @AuthenticationPrincipal User viewer) {
        return ResponseEntity.ok(postService.get(id, viewer));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostDetailResponse> updatePost(@PathVariable Integer id,
                                                         @AuthenticationPrincipal User user,
                                                         @RequestBody @Valid UpdatePostRequest request) {
        return ResponseEntity.ok(postService.update(id, user, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/like")
    public ResponseEntity<Void> likePost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.like(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlikePost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.unlike(id, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/save")
    public ResponseEntity<Void> savePost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.save(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<Void> unsavePost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.unsave(id, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/pin")
    public ResponseEntity<Void> pinPost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.pin(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/pin")
    public ResponseEntity<Void> unpinPost(@PathVariable Integer id, @AuthenticationPrincipal User user) {
        postService.unpin(id, user);
        return ResponseEntity.noContent().build();
    }

    // Unchanged from before. SecurityConfig makes this one need a login.
    @GetMapping("/{id}/download/{kind:lut|cgedit}")
    public ResponseEntity<Resource> download(@PathVariable Integer id, @PathVariable String kind) {
        FileDownload d = postService.download(id, kind.equals("lut") ? FileType.LUT : FileType.CGEDIT);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(d.sizeInBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(d.fileName(), StandardCharsets.UTF_8).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(d.resource());
    }
}
