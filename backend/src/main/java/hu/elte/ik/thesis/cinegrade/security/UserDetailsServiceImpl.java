package hu.elte.ik.thesis.cinegrade.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import hu.elte.ik.thesis.cinegrade.user.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

	private final UserRepository repository;

	@Override
	@Transactional
	public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
		String normalized = login.toLowerCase(Locale.ROOT);
		return repository.findUserByEmailOrUsername(normalized, normalized)
				.orElseThrow(() -> new UsernameNotFoundException("User not found " + login));
	}
}
