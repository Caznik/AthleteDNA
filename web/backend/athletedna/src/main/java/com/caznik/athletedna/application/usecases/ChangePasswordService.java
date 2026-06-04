package com.caznik.athletedna.application.usecases;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.PasswordHasher;
import com.caznik.athletedna.application.auth.InvalidPasswordException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.ChangePasswordUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class ChangePasswordService implements ChangePasswordUseCase {

	private static final int MIN_PASSWORD_LENGTH = 8;

	private final UserRepository userRepository;
	private final PasswordHasher passwordHasher;

	public ChangePasswordService(UserRepository userRepository, PasswordHasher passwordHasher) {
		this.userRepository = userRepository;
		this.passwordHasher = passwordHasher;
	}

	@Override
	public void changePassword(UUID userId, String currentPassword, String newPassword) {
		User user = userRepository.findById(userId).orElseThrow(UnauthenticatedException::new);

		// A user without a password hash (the seeded stub) cannot change one.
		if (user.getPasswordHash() == null
				|| !passwordHasher.matches(currentPassword, user.getPasswordHash())) {
			throw new InvalidPasswordException("Current password is incorrect");
		}

		if (newPassword == null || newPassword.length() < MIN_PASSWORD_LENGTH) {
			throw new InvalidPasswordException(
				"New password must be at least " + MIN_PASSWORD_LENGTH + " characters");
		}

		user.setPasswordHash(passwordHasher.hash(newPassword));
		userRepository.save(user);
	}
}
