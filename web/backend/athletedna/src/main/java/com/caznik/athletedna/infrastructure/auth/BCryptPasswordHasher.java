package com.caznik.athletedna.infrastructure.auth;

import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.caznik.athletedna.application.PasswordHasher;

// BCrypt adapter for the PasswordHasher port. Uses spring-security-crypto only;
// no security filter chain is configured.
@Component
@Profile("jpa")
public class BCryptPasswordHasher implements PasswordHasher {

	private final PasswordEncoder encoder = new BCryptPasswordEncoder();

	@Override
	public String hash(String rawPassword) {
		return encoder.encode(rawPassword);
	}

	@Override
	public boolean matches(String rawPassword, String passwordHash) {
		return encoder.matches(rawPassword, passwordHash);
	}
}
