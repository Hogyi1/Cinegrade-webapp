package hu.elte.ik.thesis.cinegrade.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenRepository extends JpaRepository<RegistrationToken, Integer> {

	Optional<RegistrationToken> findByCode(String code);

	@Query("SELECT t FROM RegistrationToken t WHERE t.code = :code AND t.user.email = :email")
	Optional<RegistrationToken> findByCodeWhereEmail(@Param("code") String code, @Param("email") String email);

	Optional<RegistrationToken> findFirstByUserOrderByCreatedAtDesc(User user);
}
