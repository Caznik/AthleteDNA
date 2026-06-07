package com.caznik.athletedna.application.port.in;

import java.util.UUID;

import com.caznik.athletedna.domain.model.User;

public interface UpdateThemeUseCase {
	// Sets the given user's theme preference. The value must be one of
	// "light" | "dark" | "system"; anything else raises InvalidThemeException.
	User updateTheme(UUID userId, String theme);
}
