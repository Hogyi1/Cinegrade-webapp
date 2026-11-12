package hu.elte.ik.thesis.cinegrade.search;

import hu.elte.ik.thesis.cinegrade.post.Post;
import hu.elte.ik.thesis.cinegrade.post.PostMapper;
import hu.elte.ik.thesis.cinegrade.post.PostRepository;
import hu.elte.ik.thesis.cinegrade.post.PostService;
import hu.elte.ik.thesis.cinegrade.user.User;
import hu.elte.ik.thesis.cinegrade.user.UserService;
import hu.elte.ik.thesis.cinegrade.user.dto.UserSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserService userService;
    private final PostRepository postRepository;
    private final PostMapper postMapper;

    @Transactional(readOnly = true)
    public SearchResponse search(String q, List<String> tags, String sort, User viewer, int page, int size) {
        List<String> uniqueTags = tags == null ? List.of() : tags.stream()
                .filter(t -> t != null && !t.isBlank())
                .map(t -> t.toLowerCase(Locale.ROOT))
                .distinct()
                .toList();

        int pageNumber = Math.clamp(page, 0, Integer.MAX_VALUE);
        int pageSize = Math.clamp(size, 1, PostService.MAX_PAGE_SIZE);

        List<UserSummaryResponse> users = List.of();
        if (pageNumber == 0 && q != null && !q.isBlank()) {
            users = userService.searchUsers(q.trim()).stream().limit(5).toList();
        }
        Page<Post> result = postRepository.search(q, uniqueTags, PageRequest.of(pageNumber, pageSize, PostRepository.sortOf(sort)));
        return new SearchResponse(users, postMapper.toPage(result, viewer));
    }
}
