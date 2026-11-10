package hu.elte.ik.thesis.cinegrade.session;

import hu.elte.ik.thesis.cinegrade.handler.BusinessErrorCodes;
import hu.elte.ik.thesis.cinegrade.handler.BusinessException;
import hu.elte.ik.thesis.cinegrade.security.JwtService;
import hu.elte.ik.thesis.cinegrade.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final JwtService jwtService;
    private final SecureRandom secureRandom = new SecureRandom();

    public String create(User user, ClientType clientType, String deviceName) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        sessionRepository.save(Session.builder()
                .user(user)
                .tokenHash(hash(raw))
                .clientType(clientType)
                .deviceName(deviceName)
                .lastUsedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(14))
                .build());
        return raw;
    }


    @Transactional // needed because session.getUser() is lazy
    public String refresh(String raw) {
        if (raw == null) throw new BusinessException(BusinessErrorCodes.INVALID_SESSION);
        Session session = sessionRepository.findByTokenHash(hash(raw))
                .orElseThrow(() -> new BusinessException(BusinessErrorCodes.INVALID_SESSION));
        User user = session.getUser();
        LocalDateTime now = LocalDateTime.now();

        if (session.getRevokedAt() != null || session.getExpiresAt().isBefore(now)
                || !user.isEnabled() || !user.isAccountNonLocked()) {
            throw new BusinessException(BusinessErrorCodes.INVALID_SESSION);
        }
        session.setLastUsedAt(now);
        session.setExpiresAt(now.plusDays(14));
        return jwtService.generateToken(Map.of("username", user.getUsername()), user);
    }

    @Transactional
    public void revoke(String sessionId) {
        Optional<Session> session = sessionRepository.findByTokenHash(hash(sessionId));
        session.ifPresent(s -> {
            s.setRevokedAt(LocalDateTime.now());
            sessionRepository.save(s);
        });
    }

    private String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
