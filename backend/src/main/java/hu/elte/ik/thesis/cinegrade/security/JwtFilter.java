package hu.elte.ik.thesis.cinegrade.security;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter { // Minden kérésnél egyszer fut le

	private final JwtService jwtService;
	private final UserDetailsService userDetailsService;

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {

		// Ha az API hívás az "/api/v1/auth" végponthoz tartozik, akkor kihagyjuk az
		// ellenőrzést
		if (request.getServletPath().contains("/api/v1/auth")) {
			filterChain.doFilter(request, response);
			return;
		}

		// Lekérdezzük az "Authorization" fejlécet (ez tartalmazhatja a JWT tokent)
		final String authHeader = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
		final String jwt;
		final String userEmail;

		// Ha nincs "Authorization" fejléc, vagy nem "Bearer " kezdetű, akkor
		// továbbengedjük a kérést
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		// Kinyerjük a JWT tokent (a "Bearer " utáni részt)
		jwt = authHeader.substring(7);
		userEmail = jwtService.extractUsername(jwt);

		// Ha van érvényes e-mail és a felhasználó még nincs bejelentkezve
		if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) { // A SecurityCOntext
																									// minde egyes
																									// kéréshez tartozik
			UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

			// Ellenőrizzük, hogy a JWT token érvényes-e a felhasználóra nézve
			if (jwtService.isTokenValid(jwt, userDetails)) {

				// Létrehozunk egy autentikációs tokent a felhasználó adataival
				UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
						null, userDetails.getAuthorities());

				// Beállítjuk az autentikációs adatok részleteit (pl. IP, böngésző adatok)
				authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				// Beállítjuk a Spring Security kontextusában a felhasználó autentikációját
				SecurityContextHolder.getContext().setAuthentication(authToken); // Tehcnikailag bekerül a UserDetails a
																					// secconholderbe
			}
		}
		// Folytatjuk a kérést a többi filterrel
		filterChain.doFilter(request, response);

	}

}
