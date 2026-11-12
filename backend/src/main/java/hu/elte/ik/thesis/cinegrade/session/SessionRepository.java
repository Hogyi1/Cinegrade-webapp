package hu.elte.ik.thesis.cinegrade.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findByTokenHash(String token);
    @Modifying
    @Query("update Session s set s.revokedAt = CURRENT_TIMESTAMP where s.user.id = :userId and s.revokedAt is null")
    void revokeAllForUser(@Param("userId") Long userId);
}
