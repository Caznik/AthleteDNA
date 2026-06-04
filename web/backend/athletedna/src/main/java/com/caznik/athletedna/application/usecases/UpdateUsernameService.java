package com.caznik.athletedna.application.usecases;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.auth.InvalidUsernameException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.auth.UsernameAlreadyTakenException;
import com.caznik.athletedna.application.port.in.UpdateUsernameUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class UpdateUsernameService implements UpdateUsernameUseCase {

	// Same rule as registration: a non-empty handle of at most 15 characters.
	private static final int MAX_USERNAME_LENGTH = 15;

	private final UserRepository userRepository;

	public UpdateUsernameService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public User updateUsername(UUID userId, String newUsername) {
		String normalizedUsername = newUsername == null ? "" : newUsername.trim();

		if (normalizedUsername.isEmpty() || normalizedUsername.length() > MAX_USERNAME_LENGTH) {
			throw new InvalidUsernameException(
				"Username is required and must be at most " + MAX_USERNAME_LENGTH + " characters");
		}

		User user = userRepository.findById(userId).orElseThrow(UnauthenticatedException::new);

		// Re-submitting the unchanged username is a no-op, not a conflict.
		if (normalizedUsername.equals(user.getUsername())) {
			return user;
		}

		// Reject only when the handle belongs to a *different* user.
		userRepository.findByUsername(normalizedUsername).ifPresent(existing -> {
			if (!existing.getId().equals(userId)) {
				throw new UsernameAlreadyTakenException(normalizedUsername);
			}
		});

		user.setUsername(normalizedUsername);
		return userRepository.save(user);
	}
}
