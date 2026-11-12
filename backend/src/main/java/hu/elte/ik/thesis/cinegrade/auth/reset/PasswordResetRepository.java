package hu.elte.ik.thesis.cinegrade.auth.reset;

import hu.elte.ik.thesis.cinegrade.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    Optional<PasswordResetToken> findFirstByUserOrderByCreatedAtDesc(User user);

    // A new request kills older links, so only the newest email works
    @Modifying
    @Query("update PasswordResetToken t set t.usedAt = CURRENT_TIMESTAMP where t.user = :user and t.usedAt is null")
    void invalidateAllFor(@Param("user") User user);
}