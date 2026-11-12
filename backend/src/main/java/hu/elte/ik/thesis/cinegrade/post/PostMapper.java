package hu.elte.ik.thesis.cinegrade.post;

import hu.elte.ik.thesis.cinegrade.files.StoredFile;
import hu.elte.ik.thesis.cinegrade.post.dto.PostAuthor;
import hu.elte.ik.thesis.cinegrade.post.dto.PostDetailResponse;
import hu.elte.ik.thesis.cinegrade.post.dto.PostSummaryResponse;
import hu.elte.ik.thesis.cinegrade.post.like.LikeRepository;
import hu.elte.ik.thesis.cinegrade.post.save.SavedPostRepository;
import hu.elte.ik.thesis.cinegrade.tag.Tag;
import hu.elte.ik.thesis.cinegrade.tag.TagResponse;
import hu.elte.ik.thesis.cinegrade.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;

// [AI-GENERATED] Turns posts into responses. Call it inside a @Transactional method: Post.tags is
// lazy and open-in-view is off.
@Component
@RequiredArgsConstructor
public class PostMapper {

    private final LikeRepository likes;
    private final SavedPostRepository saves;

    /** A page of tiles. likedByMe/savedByMe take two queries for the whole page. viewer may be null. */
    public PagedModel<PostSummaryResponse> toPage(Page<Post> page, User viewer) {
        List<Integer> ids = page.getContent().stream().map(Post::getId).toList();
        Set<Integer> liked = viewer == null || ids.isEmpty() ? Set.of() : likes.findLikedPostIds(viewer.getId(), ids);
        Set<Integer> saved = viewer == null || ids.isEmpty() ? Set.of() : saves.findSavedPostIds(viewer.getId(), ids);
        return new PagedModel<>(page.map(p -> toSummary(p, liked.contains(p.getId()), saved.contains(p.getId()))));
    }

    public PostSummaryResponse toSummary(Post p, boolean likedByMe, boolean savedByMe) {
        return new PostSummaryResponse(
                p.getId(),
                p.getTitle(),
                idOf(p.getBeforeFile()),
                idOf(p.getAfterFile()),
                p.getLikeCount(),
                p.getDownloadCount(),
                p.getPinnedAt() != null,
                p.getCreatedAt(),
                authorOf(p),
                tagsOf(p),
                likedByMe,
                savedByMe);
    }

    /** The post page. viewer may be null. */
    public PostDetailResponse toDetail(Post p, User viewer) {
        boolean liked = viewer != null && likes.existsByPostIdAndUserId(p.getId(), viewer.getId());
        boolean saved = viewer != null && saves.existsByPostIdAndUserId(p.getId(), viewer.getId());
        return new PostDetailResponse(
                p.getId(),
                p.getTitle(),
                p.getDescription(),
                idOf(p.getBeforeFile()),
                idOf(p.getAfterFile()),
                p.getColorSpace(),
                p.getLutFile() != null,
                p.getCgeditFile() != null,
                p.getLikeCount(),
                p.getDownloadCount(),
                p.getPinnedAt() != null,
                p.getCreatedAt(),
                p.getUpdatedAt(),
                authorOf(p),
                tagsOf(p),
                liked,
                saved,
                isOwner(p, viewer));
    }

    public static boolean isOwner(Post p, User viewer) {
        return viewer != null && Objects.equals(p.getUser().getId(), viewer.getId());
    }

    private static PostAuthor authorOf(Post p) {
        return new PostAuthor(p.getUser().getUsername(), idOf(p.getUser().getAvatarFile()));
    }

    /** Same order everywhere: by group (look, tone, subject, technical), then by name. */
    private static List<TagResponse> tagsOf(Post p) {
        return p.getTags().stream()
                .sorted(Comparator.comparing(Tag::getTagGroup).thenComparing(Tag::getName))
                .map(TagResponse::of)
                .toList();
    }

    // Reading the id of a lazy proxy doesn't load the file row.
    private static Long idOf(StoredFile file) {
        return file == null ? null : file.getId();
    }
}
