package com.caznik.athletedna.application.usecases;

import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.PasswordHasher;
import com.caznik.athletedna.application.auth.EmailAlreadyRegisteredException;
import com.caznik.athletedna.application.auth.InvalidRegistrationException;
import com.caznik.athletedna.application.auth.UsernameAlreadyTakenException;
import com.caznik.athletedna.application.port.in.RegisterUserUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class RegisterUserService implements RegisterUserUseCase {

	// Pragmatic email shape check; not a full RFC 5322 validator.
	private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
	private static final int MIN_PASSWORD_LENGTH = 8;
	private static final int MAX_USERNAME_LENGTH = 15;

	private static final Logger log = LoggerFactory.getLogger(RegisterUserService.class);

	private final UserRepository userRepository;
	private final PasswordHasher passwordHasher;

	public RegisterUserService(UserRepository userRepository, PasswordHasher passwordHasher) {
		this.userRepository = userRepository;
		this.passwordHasher = passwordHasher;
	}

	@Override
	public User register(String email, String username, String rawPassword) {
		String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
		String normalizedUsername = username == null ? "" : username.trim();

		if (!EMAIL.matcher(normalizedEmail).matches()) {
			throw new InvalidRegistrationException("A valid email is required");
		}
		if (normalizedUsername.isEmpty() || normalizedUsername.length() > MAX_USERNAME_LENGTH) {
			throw new InvalidRegistrationException(
				"Username is required and must be at most " + MAX_USERNAME_LENGTH + " characters");
		}
		if (rawPassword == null || rawPassword.length() < MIN_PASSWORD_LENGTH) {
			throw new InvalidRegistrationException(
				"Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
		}

		userRepository.findByEmail(normalizedEmail).ifPresent(existing -> {
			throw new EmailAlreadyRegisteredException(normalizedEmail);
		});
		userRepository.findByUsername(normalizedUsername).ifPresent(existing -> {
			throw new UsernameAlreadyTakenException(normalizedUsername);
		});

		User user = new User(
			UUID.randomUUID(), normalizedEmail, normalizedUsername, passwordHasher.hash(rawPassword));
		User saved = userRepository.save(user);
		log.info("Registered new user id={}", saved.getId());
		return saved;
	}
}
