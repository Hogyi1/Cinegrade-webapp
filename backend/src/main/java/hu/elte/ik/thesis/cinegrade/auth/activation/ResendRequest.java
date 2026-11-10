package hu.elte.ik.thesis.cinegrade.auth.activation;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResendRequest {
    @Email(message = "Email is not formatted")
    @NotBlank(message = "Email is mandatory")
    private String email;
}
