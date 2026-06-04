package com.caznik.athletedna.application.port.in;

import java.util.UUID;

import com.caznik.athletedna.domain.model.User;

public interface UpdateProfilePhotoUseCase {
	// Stores (or replaces) the given user's profile photo. Validates the content
	// type against the allowlist and the size limit, throwing InvalidPhotoException
	// on violation. Returns the updated user (with a fresh photoUpdatedAt).
	User updatePhoto(UUID userId, byte[] bytes, String contentType);

	// Clears the user's photo (all three columns), reverting to the initials
	// avatar. Returns the updated user.
	User removePhoto(UUID userId);
}
