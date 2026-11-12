package hu.elte.ik.thesis.cinegrade.auth;

import hu.elte.ik.thesis.cinegrade.auth.dto.AuthenticationRequest;
import hu.elte.ik.thesis.cinegrade.auth.dto.AuthenticationResponse;
import hu.elte.ik.thesis.cinegrade.auth.dto.ForgotPasswordRequest;
import hu.elte.ik.thesis.cinegrade.auth.dto.LoginResponse;
import hu.elte.ik.thesis.cinegrade.auth.dto.RegistrationRequest;
import hu.elte.ik.thesis.cinegrade.auth.activation.ActivationRequest;
import hu.elte.ik.thesis.cinegrade.auth.activation.ResendRequest;
import hu.elte.ik.thesis.cinegrade.auth.reset.ResetPasswordRequest;
import hu.elte.ik.thesis.cinegrade.session.SessionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

//@Hidden
@RestController
@RequestMapping("auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthenticationController {

    private final AuthenticationService service;
    private final SessionService sessionService;
    private final RefreshCookieFactory refreshCookie;

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
                .header(HttpHeaders.SET_COOKIE, refreshCookie.create(result.refreshToken()))
                .body(AuthenticationResponse.builder().token(result.jwt()).build());
    }

    @PostMapping("/activate")
    public void activate(@RequestBody @Valid ActivationRequest request) throws MessagingException {
        service.activateAccount(request.getEmail(), request.getCode());
    }

    @PostMapping("/activate/resend")
    public ResponseEntity<Void> resend(@RequestBody @Valid ResendRequest request) throws MessagingException {
        service.resendEmail(request.getEmail());
        return ResponseEntity.ok(null);
    }

    @GetMapping("/username-available")
    public ResponseEntity<Boolean> isUsernameAvailable(@RequestParam String username) {
        return ResponseEntity.ok(!service.isUsernameTaken(username));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refresh(@CookieValue(name = "refresh-token", required = false) String raw) {
        String jwt = sessionService.refresh(raw);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.create(raw))
                .body(AuthenticationResponse.builder().token(jwt).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = "refresh-token", required = false) String raw) {
        if (raw != null) sessionService.revoke(raw);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, refreshCookie.clear()).build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) throws MessagingException {
        service.forgotPassword(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) throws MessagingException {
        service.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}
