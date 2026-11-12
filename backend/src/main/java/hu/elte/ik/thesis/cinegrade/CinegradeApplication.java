package hu.elte.ik.thesis.cinegrade;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

import hu.elte.ik.thesis.cinegrade.user.role.UserRole;
import hu.elte.ik.thesis.cinegrade.user.role.RoleRepository;

import java.util.List;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class CinegradeApplication {

	public static void main(String[] args) {
		SpringApplication.run(CinegradeApplication.class, args);
	}

	@Bean
	public CommandLineRunner runner(RoleRepository roleRepository) {
		return args -> {
			for (String name : List.of("ROLE_USER", "ROLE_ADMIN")){
				if (roleRepository.findByName(name).isEmpty()) {
					roleRepository.save(UserRole.builder().name(name).build());
				}
			}
		};
	}

}
