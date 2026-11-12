package hu.elte.ik.thesis.cinegrade.tag;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// [AI-GENERATED] GET /tags: the whole fixed list, for the tag picker and the filter chips.
// Small and read-only, so it goes straight to the repository.
@RestController
@RequestMapping("tags")
@RequiredArgsConstructor
@Tag(name = "Tags")
public class TagController {

    private final TagRepository tagRepository;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getTags() {
        return ResponseEntity.ok(tagRepository.findAll(Sort.by("tagGroup", "name")).stream()
                .map(TagResponse::of)
                .toList());
    }
}
