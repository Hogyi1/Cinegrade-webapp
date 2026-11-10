package hu.elte.ik.thesis.cinegrade.auth;

import hu.elte.ik.thesis.cinegrade.auth.activation.ActivationRequest;
import hu.elte.ik.thesis.cinegrade.auth.activation.ResendRequest;
import hu.elte.ik.thesis.cinegrade.session.SessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.Cookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.time.Duration;

//@Hidden
@RestController
@RequestMapping("auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthenticationController {

    private final AuthenticationService service;
    private final SessionService sessionService;

    @Value("${application.secure}")
    private boolean secureCookie;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<?> register(@RequestBody @Valid RegistrationRequest request) throws MessagingException {
        service.register(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody @Valid AuthenticationRequest request) {
        LoginResponse result = service.authenticate(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(result.refreshToken(), Duration.ofDays(14)))
                .body(AuthenticationResponse.builder().token(result.jwt()).build());
    }

    @PostMapping("/activate")
    public void activate(@RequestBody @Valid ActivationRequest request) throws MessagingException {
        service.activateAccount(request.getEmail(), request.getCode());
    }

    @PostMapping("/activate/resend")
    public void resend(@RequestBody @Valid ResendRequest request) throws MessagingException {
        service.resendEmail(request.getEmail());
    }

    @GetMapping("/username-available")
    public ResponseEntity<Boolean> isUsernameAvailable(@RequestParam String username) {
        return ResponseEntity.ok(!service.isUsernameTaken(username));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refresh(@CookieValue(name = "refresh-token", required = false) String raw) {
        String jwt = sessionService.refresh(raw);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(raw, Duration.ofDays(14)))
                .body(AuthenticationResponse.builder().token(jwt).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = "refresh-token", required = false) String raw) {
        if (raw != null) sessionService.revoke(raw);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO)).build();
    }

    private String cookie(String value, Duration maxAge) {
        return ResponseCookie.from("refresh-token", value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(maxAge).build().toString();
    }
}
