package hu.elte.ik.thesis.cinegrade.auth;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import hu.elte.ik.thesis.cinegrade.email.EmailService;
import hu.elte.ik.thesis.cinegrade.email.EmailTemplateName;
import hu.elte.ik.thesis.cinegrade.role.RoleRepository;
import hu.elte.ik.thesis.cinegrade.security.JwtService;
import hu.elte.ik.thesis.cinegrade.user.Token;
import hu.elte.ik.thesis.cinegrade.user.TokenRepository;
import hu.elte.ik.thesis.cinegrade.user.User;
import hu.elte.ik.thesis.cinegrade.user.UserRepository;

import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserRepository userRepository;
	private final TokenRepository tokenRepository;
	private final EmailService emailService;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	@Value("${application.security.mailing.frontend.activation-url}")
	private String activationUrl;

	public void register(RegistrationRequest request) throws MessagingException {

		var userRole = roleRepository.findByName("USER").orElseThrow(() -> new IllegalArgumentException());

		var user = User.builder().firstName(request.getFirstName()).lastName(request.getLastName())
				.email(request.getEmail()).password(passwordEncoder.encode(request.getPassword())).accountLocked(false)
				.enabled(false).roles(List.of(userRole)).build();

		userRepository.save(user);
		sendValidationEmail(user);
	}

	private void sendValidationEmail(User user) throws MessagingException {

		var newToken = generateAndSaveActivationToken(user);

		emailService.sendEmail(user.getEmail(), user.getFullname(), EmailTemplateName.ACTIVATE_ACCOUNT, activationUrl,
				newToken, "Account activation");
	}

	private String generateAndSaveActivationToken(User user) {

		String generatedToken = generateActivationToken(6);
		var token = Token.builder().token(generatedToken).createdAt(LocalDateTime.now())
				.expiresAt(LocalDateTime.now().plusMinutes(15)).user(user).build();
		tokenRepository.save(token);
		return generatedToken;

	}

	private String generateActivationToken(int length) {
		String characters = "0123456789";
		StringBuilder codeBuilder = new StringBuilder();
		SecureRandom secureRandom = new SecureRandom();
		for (int i = 0; i < length; i++) {
			int randomIndex = secureRandom.nextInt(characters.length());
			codeBuilder.append(characters.charAt(randomIndex));
		}
		return codeBuilder.toString();
	}

	public AuthenticationResponse authenticate(@Valid AuthenticationRequest request) {

		var auth = authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

		var claims = new HashMap<String, Object>();
		var user = ((User) auth.getPrincipal());
		claims.put("fullName", user.getFullname());
		var jwtToken = jwtService.generateToken(claims, user);
		return AuthenticationResponse.builder().token(jwtToken).build();
	}

	// @Transactional
	public void activateAccount(String token) throws MessagingException {

		Token savedToken = tokenRepository.findByToken(token).orElseThrow(() -> new IllegalAccessError());

		if (LocalDateTime.now().isAfter(savedToken.getExpiresAt())) {
			sendValidationEmail(savedToken.getUser());
			throw new RuntimeException(
					"Activation token has expired. A new token has been sent to the same emial address");
		}

		var user = userRepository.findById(savedToken.getUser().getId())
				.orElseThrow(() -> new IllegalArgumentException());
		user.setEnabled(true);
		userRepository.save(user);
		savedToken.setValidatedAt(LocalDateTime.now());
		tokenRepository.save(savedToken);

	}

}
