package hu.elte.ik.thesis.cinegrade.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor // Jackson 3 (Spring Boot 4) üres konstruktorral hozza létre a JSON-ból
@AllArgsConstructor
//Megnézni a custom validatort
public class RegistrationRequest {

	@NotEmpty(message = "First name is mandatory")
	@NotBlank(message = "First name is mandatory")
	private String firstName;
	@NotEmpty(message = "Last name is mandatory")
	@NotBlank(message = "Last name is mandatory")
	private String lastName;
	@Email(message = "Email is not formatted")
	@NotEmpty(message = "Email is mandatory")
	@NotBlank(message = "Email is mandatory")
	private String email;
	@NotEmpty(message = "Password is mandatory")
	@NotBlank(message = "Password is mandatory")
	@Size(min = 8, message = "Password should be 8 characters long minimum")
	private String password;

}
