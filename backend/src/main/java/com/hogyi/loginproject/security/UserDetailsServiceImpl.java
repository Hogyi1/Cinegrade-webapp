package com.hogyi.loginproject.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.hogyi.loginproject.user.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

	private final UserRepository repository;

	// Csak szimplán betöltjük azt a usert aki be akar jelentkezni az emailje
	// alapján
	@Override
	@Transactional
	public UserDetails loadUserByUsername(String userEmail) throws UsernameNotFoundException {
		return repository.findUserByEmail(userEmail)
				.orElseThrow(() -> new UsernameNotFoundException("User not found " + "userEmail"));
	}

}
