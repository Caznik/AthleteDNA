package com.caznik.athletedna.application.usecases;

import java.util.Set;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.auth.InvalidLanguageException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.UpdateLanguageUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class UpdateLanguageService implements UpdateLanguageUseCase {

	// The only values the client is allowed to store. Lowercase ISO-639-1 codes.
	private static final Set<String> ALLOWED_LANGUAGES = Set.of("en", "es");

	private final UserRepository userRepository;

	public UpdateLanguageService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public User updateLanguage(UUID userId, String language) {
		String normalized = language == null ? "" : language.trim();

		if (!ALLOWED_LANGUAGES.contains(normalized)) {
			throw new InvalidLanguageException("Language must be one of en or es");
		}

		User user = userRepository.findById(userId).orElseThrow(UnauthenticatedException::new);

		// Re-selecting the current language is a no-op — skip the redundant UPDATE.
		if (normalized.equals(user.getLanguagePreference())) {
			return user;
		}

		user.setLanguagePreference(normalized);
		return userRepository.save(user);
	}
}
