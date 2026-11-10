package hu.elte.ik.thesis.cinegrade.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

import hu.elte.ik.thesis.cinegrade.handler.BusinessErrorCodes;
import hu.elte.ik.thesis.cinegrade.handler.BusinessException;
import hu.elte.ik.thesis.cinegrade.role.UserRole;
import hu.elte.ik.thesis.cinegrade.session.ClientType;
import hu.elte.ik.thesis.cinegrade.session.SessionService;
import jakarta.validation.constraints.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import hu.elte.ik.thesis.cinegrade.email.EmailService;
import hu.elte.ik.thesis.cinegrade.email.EmailTemplateName;
import hu.elte.ik.thesis.cinegrade.role.RoleRepository;
import hu.elte.ik.thesis.cinegrade.security.JwtService;
import hu.elte.ik.thesis.cinegrade.user.RegistrationToken;
import hu.elte.ik.thesis.cinegrade.user.TokenRepository;
import hu.elte.ik.thesis.cinegrade.user.User;
import hu.elte.ik.thesis.cinegrade.user.UserRepository;

import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;
    private final SessionService sessionService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final Integer activationTokenLength = 6;
    private final Integer activationTokenExpiration = 15;
    private final SecureRandom secureRandom = new SecureRandom();
    @Value("${application.security.mailing.frontend.activation-url}")
    private String activationUrl;
    @Value("${application.max-activation-attempts}")
    private int maxActivationAttempts;

    public boolean isUsernameTaken(String username) {
        return userRepository.existsByUsername(username.toLowerCase(Locale.ROOT));
    }

    @Transactional
    public void register(RegistrationRequest request) throws MessagingException {

        String username = request.getUsername().toLowerCase(Locale.ROOT);
        String email = request.getEmail().toLowerCase(Locale.ROOT);

        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(BusinessErrorCodes.USERNAME_TAKEN);
        }
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(BusinessErrorCodes.EMAIL_TAKEN);
        }

        UserRole userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER is not seeded"));

        var user = User.builder().username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .accountLocked(false)
                .enabled(false)
                .userRole(userRole)
                .build();

        userRepository.save(user);
        sendValidationEmail(user);
    }

    public LoginResponse authenticate(AuthenticationRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getLogin(), request.getPassword()));
        var user = (User) auth.getPrincipal();
        String jwt = jwtService.generateToken(Map.of("username", user.getUsername()), user);
        return new LoginResponse(jwt, sessionService.create(user, ClientType.WEB, null));
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public void activateAccount(String login, String code) throws MessagingException {
        String normalized = login.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findUserByEmailOrUsername(normalized, normalized)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.INVALID_ACTIVATION_CODE));
        RegistrationToken registrationToken = tokenRepository.findFirstByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.INVALID_ACTIVATION_CODE));

        if (registrationToken.getValidatedAt() != null) {
            throw new BusinessException(BusinessErrorCodes.INVALID_ACTIVATION_CODE);
        }
        if (registrationToken.getAttempts() >= maxActivationAttempts) {
            throw new BusinessException(BusinessErrorCodes.ACTIVATION_ATTEMPTS_EXCEEDED);
        }
        if (!registrationToken.getCode().equals(code)) {
            registrationToken.setAttempts(registrationToken.getAttempts() + 1);
            throw new BusinessException(BusinessErrorCodes.INVALID_ACTIVATION_CODE);
        }
        if (LocalDateTime.now().isAfter(registrationToken.getExpiresAt())) {
            sendValidationEmail(user);
            throw new BusinessException(BusinessErrorCodes.ACTIVATION_CODE_EXPIRED);
        }

        user.setEnabled(true);
        registrationToken.setValidatedAt(LocalDateTime.now());
    }

    private void sendValidationEmail(User user) throws MessagingException {
        var newToken = generateAndSaveActivationCode(user);

        emailService.sendEmail(user.getEmail(), user.getUsername(), EmailTemplateName.ACTIVATE_ACCOUNT,
                activationLink(user, newToken), newToken, "Account activation");
    }

    @Transactional
    public void resendEmail(String email) throws MessagingException {
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findUserByEmailOrUsername(normalized, normalized).orElse(null);
        if (user == null || user.isEnabled()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        RegistrationToken latest = tokenRepository.findFirstByUserOrderByCreatedAtDesc(user).orElse(null);

        if (latest != null && latest.getLastSentAt() != null && latest.getLastSentAt().isAfter(now.minusSeconds(60))) {
            return;
        }

        boolean stillActive = latest != null
                && now.isBefore(latest.getExpiresAt())
                && latest.getAttempts() < maxActivationAttempts;

        if (stillActive) {
            latest.setLastSentAt(now);
            emailService.sendEmail(user.getEmail(), user.getUsername(), EmailTemplateName.ACTIVATE_ACCOUNT,
                    activationLink(user, latest.getCode()), latest.getCode(), "Account activation");
        } else {
            sendValidationEmail(user);
        }
    }

    private String generateAndSaveActivationCode(User user) {
        String generatedCode = generateActivationCode(activationTokenLength);
        var token = RegistrationToken
                .builder()
                .code(generatedCode)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(activationTokenExpiration))
                .user(user)
                .attempts(0)
                .lastSentAt(LocalDateTime.now())
                .build();

        tokenRepository.save(token);
        return generatedCode;
    }

    private String generateActivationCode(int length) {
        return secureRandom.ints(length, 0, 10)
                .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append)
                .toString();
    }

    private String activationLink(User user, String code) {
        return activationUrl + "?email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) + "&code=" + code;
    }
}
