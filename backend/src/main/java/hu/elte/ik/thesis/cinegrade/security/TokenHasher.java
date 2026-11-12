package hu.elte.ik.thesis.cinegrade.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

/**
 * Random tokens for links and cookies (sessions, password resets).
 * The raw token goes to the user; only its hash is stored, so a leaked database can't be used to log in.
 */
@Component
public class TokenHasher {

    private final SecureRandom secureRandom = new SecureRandom();

    /** 32 random bytes, URL-safe, so it fits in a cookie or a link as is. */
    public String newRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** SHA-256 in hex. Fine without a salt, because the token itself is long and random. */
    public String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
