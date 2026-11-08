package hu.elte.ik.thesis.cinegrade.role;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<hu.elte.ik.thesis.cinegrade.role.Role, Integer> {

	Optional<hu.elte.ik.thesis.cinegrade.role.Role> findByName(String role);
}
