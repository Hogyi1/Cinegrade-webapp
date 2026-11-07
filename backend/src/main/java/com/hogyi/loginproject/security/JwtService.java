package com.hogyi.loginproject.security;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
	// JWT lejárati idő (konfigurációból betöltve)
	@Value("${application.security.jwt.expiration}")
	private Long jwtExpiration;

	// Titkos kulcs a token aláírásához (konfigurációból betöltve)
	@Value("${application.security.jwt.secret-key}")
	private String secretKey;

	/**
	 * Kinyeri a felhasználónevet a JWT tokenből.
	 * 
	 * @param token A vizsgált JWT token
	 * @return A felhasználó neve (username)
	 */
	public String extractUsername(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	/**
	 * Általános metódus egy adott claim (adat) kinyerésére a JWT tokenből.
	 * 
	 * @param token         A vizsgált token
	 * @param claimResolver A kívánt claim kinyerésének függvénye
	 * @param <T>           A visszatérési érték típusa
	 * @return A kívánt claim értéke
	 */
	private <T> T extractClaim(String token, Function<Claims, T> claimResolver) {
		final Claims claims = extractAllClaims(token);
		return claimResolver.apply(claims);
	}

	/**
	 * Kinyeri az összes claim-et (adatot) a JWT tokenből.
	 * 
	 * @param token A vizsgált token
	 * @return A tokenben tárolt adatok (Claims objektumként)
	 */
	private Claims extractAllClaims(String token) {
		return Jwts.parserBuilder().setSigningKey(getSignInKey()).build().parseClaimsJws(token).getBody();
	}

	/**
	 * JWT token generálása egy adott felhasználó számára.
	 * 
	 * @param userDetails A felhasználó adatai
	 * @return A generált JWT token
	 */
	public String generateToken(UserDetails userDetails) {
		return generateToken(new HashMap<>(), userDetails);
	}

	/**
	 * JWT token generálása extra adatokkal.
	 * 
	 * @param claims      Extra adatok, amelyeket a token tartalmazhat
	 * @param userDetails A felhasználó adatai
	 * @return A generált JWT token
	 */
	public String generateToken(Map<String, Object> claims, UserDetails userDetails) {
		return buildToken(claims, userDetails, jwtExpiration);
	}

	/**
	 * A JWT token tényleges összeállítása és aláírása.
	 * 
	 * @param extraClaims   Extra adatok a tokenhez
	 * @param userDetails   A felhasználó adatai
	 * @param jwtExpiration A token lejárati ideje
	 * @return A végleges JWT token
	 */
	private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, Long jwtExpiration) {

		// Kinyerjük a felhasználó jogosultságait (pl. ROLE_USER, ROLE_ADMIN stb.)
		var authorities = userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();

		return Jwts.builder().setClaims(extraClaims) // Extra adatok beállítása
				.setSubject(userDetails.getUsername()) // Felhasználónév beállítása
				.setIssuedAt(new Date(System.currentTimeMillis())) // Token kiállítási idő
				.setExpiration(new Date(System.currentTimeMillis() + jwtExpiration)) // Lejárati idő beállítása
				.claim("authorities", authorities) // Jogosultságok hozzáadása a tokenhez
				.signWith(getSignInKey()) // Aláírás a titkos kulccsal
				.compact(); // Token véglegesítése
	}

	/**
	 * Ellenőrzi, hogy egy token érvényes-e egy adott felhasználóhoz.
	 * 
	 * @param token       A vizsgált token
	 * @param userDetails A felhasználó adatai
	 * @return Igaz, ha a token érvényes, hamis, ha nem
	 */
	public boolean isTokenValid(String token, UserDetails userDetails) {
		final String username = extractUsername(token);
		return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
	}

	/**
	 * Ellenőrzi, hogy egy JWT token lejárt-e.
	 * 
	 * @param token A vizsgált token
	 * @return Igaz, ha a token lejárt, hamis, ha még érvényes
	 */
	private boolean isTokenExpired(String token) {
		return extractExpiration(token).before(new Date());
	}

	/**
	 * Kinyeri a token lejárati dátumát.
	 * 
	 * @param token A vizsgált token
	 * @return A token lejárati dátuma
	 */
	private Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	/**
	 * Betölti a titkos kulcsot a konfigurációból és visszaadja megfelelő
	 * formátumban.
	 * 
	 * @return A JWT aláírásához használt titkos kulcs
	 */
	private Key getSignInKey() {
		byte[] keyBytes = Decoders.BASE64.decode(secretKey);
		return Keys.hmacShaKeyFor(keyBytes);
	}

}
