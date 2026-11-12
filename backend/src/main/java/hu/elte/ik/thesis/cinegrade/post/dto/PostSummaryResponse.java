package hu.elte.ik.thesis.cinegrade.post.dto;

import hu.elte.ik.thesis.cinegrade.tag.TagResponse;

import java.time.LocalDateTime;
import java.util.List;

// [AI-GENERATED] One tile in a grid (feed, profile, saved, search). Build it with PostMapper.
// likedByMe and savedByMe are false when nobody is logged in.
public record PostSummaryResponse(
        Integer id,
        String title,
        Long beforeFileId,
        Long afterFileId,
        long likeCount,
        long downloadCount,
        boolean pinned,
        LocalDateTime createdAt,
        PostAuthor author,
        List<TagResponse> tags,
        boolean likedByMe,
        boolean savedByMe) {
}
