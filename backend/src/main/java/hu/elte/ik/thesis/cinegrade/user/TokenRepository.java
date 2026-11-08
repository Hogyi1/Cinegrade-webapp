package hu.elte.ik.thesis.cinegrade.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenRepository extends JpaRepository<Token, Integer> {

	Optional<Token> findByToken(String token);

}
