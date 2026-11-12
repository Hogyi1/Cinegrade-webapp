package hu.elte.ik.thesis.cinegrade.post.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

// [AI-GENERATED] PATCH /posts/{id}. A null field stays as it is; tags = [] removes every tag.
// The files and the images can't be changed: delete the post and upload a new one.
public record UpdatePostRequest(
        @Size(max = 120, message = "Title can be at most 120 characters")
        @Pattern(regexp = "(?s).*\\S.*", message = "Title can't be empty")
        String title,

        @Size(max = 2000, message = "Description can be at most 2000 characters")
        String description,

        @Size(max = CreatePostRequest.MAX_TAGS, message = "You can add at most 5 tags")
        List<String> tags) {
}
