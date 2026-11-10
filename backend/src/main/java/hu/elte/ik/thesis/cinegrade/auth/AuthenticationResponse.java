package hu.elte.ik.thesis.cinegrade.auth;

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
public class AuthenticationResponse {
	private String token;
}
