package com.caznik.athletedna.application.port.in;

import java.util.UUID;

import com.caznik.athletedna.domain.model.User;

public interface UpdateUsernameUseCase {
	// Changes the username of the given user. Throws InvalidUsernameException for
	// bad input and UsernameAlreadyTakenException if another user holds it.
	// Re-applying the user's current username is a no-op (not a conflict).
	User updateUsername(UUID userId, String newUsername);
}
