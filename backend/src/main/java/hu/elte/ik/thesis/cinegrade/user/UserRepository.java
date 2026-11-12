package hu.elte.ik.thesis.cinegrade.user;

import java.util.List;
import java.util.Optional;

import hu.elte.ik.thesis.cinegrade.user.dto.UserSummaryResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findUserByEmailOrUsername(String email, String username);
	Optional<User> findUserByUsername(String username);
	Optional<User> findUserByEmail(String email);
	Optional<User> findUserById(Long id);
	boolean existsUserByUsername(String username);
	boolean existsUserByEmail(String email);

	@Query("""
      SELECT new hu.elte.ik.thesis.cinegrade.user.dto.UserSummaryResponse(
          u.username, a.id, COUNT(f))
      FROM User u
      LEFT JOIN u.avatarFile a
      LEFT JOIN Follow f ON f.followed = u
      WHERE LOWER(u.username) LIKE LOWER(CONCAT(:query, '%')) ESCAPE '\\'
        AND u.enabled = true
        AND u.accountLocked = false
      GROUP BY u.id, u.username, a.id
      ORDER BY COUNT(f) DESC, u.username
      """)
	List<UserSummaryResponse> searchByPrefix(@Param("query") String query, Pageable pageable);
}
