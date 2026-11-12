package hu.elte.ik.thesis.cinegrade.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDescriptionRequest {
    @Size(max = 750, message = "Description can be at most 750 characters")
    private String description;
}
