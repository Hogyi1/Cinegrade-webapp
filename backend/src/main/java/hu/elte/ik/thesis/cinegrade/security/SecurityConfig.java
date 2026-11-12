package hu.elte.ik.thesis.cinegrade.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration // Ez egy konfigurációs osztály, amelyet a Spring feldolgoz
@EnableWebSecurity // Engedélyezi a Spring Security webes biztonsági beállításait
@RequiredArgsConstructor // Lombok annotáció: automatikusan létrehozza a konstruktort a final mezőknek
@EnableMethodSecurity(securedEnabled = true) // Engedélyezi a metódusszintű biztonságot (pl. @Secured("ROLE_ADMIN") csak
												// // admin férhet hozzá)
public class SecurityConfig {

	private final JwtFilter jwtAuthFilter;
	private final AuthenticationProvider authenticationProvider;

	@Bean // A Spring ezt a metódust automatikusan meghívja és a visszatérési értékét
			// bean-ként kezeli
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				// CORS (Cross-Origin Resource Sharing) engedélyezése alapértelmezett
				// beállításokkal
				.cors(Customizer.withDefaults())

				// CSRF (Cross-Site Request Forgery) védelem kikapcsolása, mivel REST API esetén
				// nincs rá szükség
				.csrf(AbstractHttpConfigurer::disable)

				// Meghatározzuk, mely végpontokat lehet elérni autentikáció nélkül
				.authorizeHttpRequests(req -> req
						.requestMatchers(HttpMethod.GET, "/files/**").permitAll()
						// /users/me first: the first matching rule wins
						.requestMatchers("/users/me", "/users/me/**").authenticated()
						.requestMatchers(HttpMethod.GET, "/users/**").permitAll()
						// [AI-GENERATED] Posts, tags and search are public to read; downloads need an account.
						// The download rule must stay above /posts/**.
						.requestMatchers(HttpMethod.GET, "/posts/*/download/**").authenticated()
						.requestMatchers(HttpMethod.GET, "/posts", "/posts/**", "/tags", "/search").permitAll()
						.requestMatchers("/auth/**", "/v2/api-docs", "/v3/api-docs", "/v3/api-docs/**",
								"/swagger-resources", "/swagger-resources/**", "/configuration/ui",
								"/configuration/security", "/swagger-ui/**", "/webjars/**", "/swagger-ui.html")
						.permitAll().anyRequest().authenticated())

				// A session kezelést stateless módra állítjuk (JWT tokenek miatt nincs
				// állapotkezelés)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

				.exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))

				// Az autentikációs szolgáltató beállítása
				.authenticationProvider(authenticationProvider)

				// JWT alapú autentikációs filter hozzáadása a beépített
				// UsernamePasswordAuthenticationFilter elé
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();

	}

}
