package hu.elte.ik.thesis.cinegrade.post.dto;

import hu.elte.ik.thesis.cinegrade.post.ColorSpace;
import hu.elte.ik.thesis.cinegrade.tag.TagResponse;

import java.time.LocalDateTime;
import java.util.List;

// [AI-GENERATED] The post page. Build it with PostMapper.toDetail.
// mine = the viewer wrote it, so the page shows edit, pin and delete.
public record PostDetailResponse(
        Integer id,
        String title,
        String description,
        Long beforeFileId,
        Long afterFileId,
        ColorSpace colorSpace,
        boolean hasLut,
        boolean hasCgedit,
        long likeCount,
        long downloadCount,
        boolean pinned,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        PostAuthor author,
        List<TagResponse> tags,
        boolean likedByMe,
        boolean savedByMe,
        boolean mine) {
}
