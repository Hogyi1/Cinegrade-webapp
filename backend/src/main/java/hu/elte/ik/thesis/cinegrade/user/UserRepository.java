package hu.elte.ik.thesis.cinegrade.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findUserByEmailOrUsername(String email, String username);
	Optional<User> findUserByUsername(String username);
	Optional<User> findUserById(Long id);
	boolean existsByUsername(String username);
	boolean existsByEmail(String email);
}
