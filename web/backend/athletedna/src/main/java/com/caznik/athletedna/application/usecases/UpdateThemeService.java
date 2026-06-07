package com.caznik.athletedna.application.usecases;

import java.util.Set;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.auth.InvalidThemeException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.UpdateThemeUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class UpdateThemeService implements UpdateThemeUseCase {

	// The only values the client is allowed to store. "system" follows the OS.
	private static final Set<String> ALLOWED_THEMES = Set.of("light", "dark", "system");

	private final UserRepository userRepository;

	public UpdateThemeService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public User updateTheme(UUID userId, String theme) {
		String normalized = theme == null ? "" : theme.trim();

		if (!ALLOWED_THEMES.contains(normalized)) {
			throw new InvalidThemeException("Theme must be one of light, dark, or system");
		}

		User user = userRepository.findById(userId).orElseThrow(UnauthenticatedException::new);

		// Re-selecting the current theme is a no-op — skip the redundant UPDATE.
		if (normalized.equals(user.getThemePreference())) {
			return user;
		}

		user.setThemePreference(normalized);
		return userRepository.save(user);
	}
}
