package hu.elte.ik.thesis.cinegrade.search;

import hu.elte.ik.thesis.cinegrade.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// [AI-GENERATED] One search for people and posts: /search?q=night&tags=teal-orange&tags=moody
@RestController
@RequestMapping("search")
@RequiredArgsConstructor
@Tag(name = "Search")
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<SearchResponse> search(@AuthenticationPrincipal User viewer,
                                                 @RequestParam(required = false) String q,
                                                 @RequestParam(required = false) List<String> tags,
                                                 @RequestParam(defaultValue = "new") String sort,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(searchService.search(q, tags, sort, viewer, page, size));
    }
}
