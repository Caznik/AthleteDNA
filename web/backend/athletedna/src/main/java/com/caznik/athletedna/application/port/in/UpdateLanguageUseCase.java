package com.caznik.athletedna.application.port.in;

import java.util.UUID;

import com.caznik.athletedna.domain.model.User;

public interface UpdateLanguageUseCase {
	// Sets the given user's language preference. The value must be one of
	// "en" | "es"; anything else raises InvalidLanguageException.
	User updateLanguage(UUID userId, String language);
}
