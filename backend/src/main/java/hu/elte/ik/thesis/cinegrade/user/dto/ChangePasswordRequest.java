package hu.elte.ik.thesis.cinegrade.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is mandatory")
    private String currentPassword;

    // Same rules as RegistrationRequest.password
    @NotBlank(message = "New password is mandatory")
    @Size(min = 8, message = "Password should be minimum 8 characters long")
    @Pattern(
            regexp = "^(?=(?:.*\\d){2,}).*$",
            message = "Password must contain at least 2 numbers"
    )
    @Pattern(
            regexp = "^(?=.*[^a-zA-Z0-9\\s]).*$",
            message = "Password must contain at least 1 special character"
    )
    private String newPassword;

    // Checked against newPassword in the service (NEW_PASSWORD_DOES_NOT_MATCH)
    @NotBlank(message = "Please confirm the new password")
    private String confirmPassword;
}
