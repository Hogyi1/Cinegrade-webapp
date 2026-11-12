package hu.elte.ik.thesis.cinegrade.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

// [AI-GENERATED] POST /posts as multipart/form-data. Bind it with @ModelAttribute @Valid, so the
// text fields and the files arrive in one object. Tags are repeated form fields: tags=warm&tags=noir.
// Replaces PostRequest (commentsEnabled went with the comments feature).
@Getter
@Setter
@NoArgsConstructor
public class CreatePostRequest {

    public static final int MAX_TAGS = 5;

    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title can be at most 120 characters")
    private String title;

    @Size(max = 2000, message = "Description can be at most 2000 characters")
    private String description;

    // Slugs from GET /tags. The service checks they exist (UNKNOWN_TAG).
    @Size(max = MAX_TAGS, message = "You can add at most 5 tags")
    private List<String> tags = new ArrayList<>();

    @NotNull(message = "The before image is required")
    private MultipartFile before;

    @NotNull(message = "The after image is required")
    private MultipartFile after;

    // At least one of these two (POST_FILE_REQUIRED).
    private MultipartFile lut;
    private MultipartFile cgedit;
}
