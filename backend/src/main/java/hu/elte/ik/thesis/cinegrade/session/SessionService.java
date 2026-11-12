package hu.elte.ik.thesis.cinegrade.session;

import hu.elte.ik.thesis.cinegrade.handler.BusinessErrorCodes;
import hu.elte.ik.thesis.cinegrade.handler.BusinessException;
import hu.elte.ik.thesis.cinegrade.security.JwtService;
import hu.elte.ik.thesis.cinegrade.security.TokenHasher;
import hu.elte.ik.thesis.cinegrade.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final JwtService jwtService;
    private final TokenHasher tokenHasher;

    public String create(User user, ClientType clientType, String deviceName) {
        String raw = tokenHasher.newRawToken();

        sessionRepository.save(Session.builder()
                .user(user)
                .tokenHash(tokenHasher.hash(raw))
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
        Session session = sessionRepository.findByTokenHash(tokenHasher.hash(raw))
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
        Optional<Session> session = sessionRepository.findByTokenHash(tokenHasher.hash(sessionId));
        session.ifPresent(s -> {
            s.setRevokedAt(LocalDateTime.now());
            sessionRepository.save(s);
        });
    }

    @Transactional
    public void revokeAll(User user) {
        sessionRepository.revokeAllForUser(user.getId());
    }
}
