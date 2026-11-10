package hu.elte.ik.thesis.cinegrade.post;

import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {

    @NotEmpty(message = "Title is required")
    @NotBlank(message = "Title is required")
    private String title;

    @NotEmpty(message = "Description is required")
    @NotBlank(message = "Description is required")
    private String description;

    @NotNull
    private boolean commentsEnabled;
}
