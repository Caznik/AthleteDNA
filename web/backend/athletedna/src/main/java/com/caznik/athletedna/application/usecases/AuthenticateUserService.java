package com.caznik.athletedna.application.usecases;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.PasswordHasher;
import com.caznik.athletedna.application.auth.InvalidCredentialsException;
import com.caznik.athletedna.application.port.in.AuthenticateUserUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class AuthenticateUserService implements AuthenticateUserUseCase {

	private static final Logger log = LoggerFactory.getLogger(AuthenticateUserService.class);

	private final UserRepository userRepository;
	private final PasswordHasher passwordHasher;

	public AuthenticateUserService(UserRepository userRepository, PasswordHasher passwordHasher) {
		this.userRepository = userRepository;
		this.passwordHasher = passwordHasher;
	}

	@Override
	public User authenticate(String email, String rawPassword) {
		String normalizedEmail = email == null ? "" : email.trim().toLowerCase();

		User user = userRepository.findByEmail(normalizedEmail)
			.orElseThrow(InvalidCredentialsException::new);

		// Users without a password hash (e.g. the seeded stub user) cannot log in.
		if (user.getPasswordHash() == null
				|| !passwordHasher.matches(rawPassword, user.getPasswordHash())) {
			throw new InvalidCredentialsException();
		}

		log.info("User authenticated id={}", user.getId());
		return user;
	}
}
