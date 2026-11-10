package hu.elte.ik.thesis.cinegrade.auth;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequest {

	@NotBlank(message = "Username is mandatory")
	@Pattern(regexp = "^[a-zA-Z0-9_]{3,30}$", message = "Use 3 to 30 letters, numbers or underscores")
	private String username;

	@Email(message = "Email is not formatted")
	@NotEmpty(message = "Email is mandatory")
	@NotBlank(message = "Email is mandatory")
	private String email;

	@NotBlank(message = "Password is mandatory")
	@Size(min = 8, message = "Password should be minimum 8 characters long")
	@Pattern(
			regexp = "^(?=(?:.*\\d){2,}).*$",
			message = "Password must contain at least 2 numbers"
	)
	@Pattern(
			regexp = "^(?=.*[^a-zA-Z0-9\\s]).*$",
			message = "Password must contain at least 1 special character"
	)
	private String password;
}
