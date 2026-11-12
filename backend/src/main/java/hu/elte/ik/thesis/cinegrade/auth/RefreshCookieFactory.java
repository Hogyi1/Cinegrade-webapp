package hu.elte.ik.thesis.cinegrade.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshCookieFactory {

    public static final String NAME = "refresh-token";
    public static final Duration MAX_AGE = Duration.ofDays(14);

    @Value("${application.secure}")
    private boolean secureCookie;

    /** Cookie holding a new refresh token (login, refresh, password change). */
    public String create(String refreshToken) {
        return build(refreshToken, MAX_AGE);
    }

    /** Cookie that makes the browser delete the refresh token (logout). */
    public String clear() {
        return build("", Duration.ZERO);
    }

    private String build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/v1/auth")   // the browser only sends it to /auth/refresh and /auth/logout
                .maxAge(maxAge)
                .build().toString();
    }
}
