package hu.elte.ik.thesis.cinegrade.search;

import hu.elte.ik.thesis.cinegrade.post.dto.PostSummaryResponse;
import hu.elte.ik.thesis.cinegrade.user.dto.UserSummaryResponse;
import org.springframework.data.web.PagedModel;

import java.util.List;

// [AI-GENERATED] GET /search. users is the top 5 by followers, only on page 0 and only when q isn't
// blank (an empty list otherwise); posts is the paged result for q and the tags.
public record SearchResponse(List<UserSummaryResponse> users, PagedModel<PostSummaryResponse> posts) {
}
