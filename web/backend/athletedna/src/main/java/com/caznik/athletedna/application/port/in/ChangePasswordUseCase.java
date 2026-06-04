package com.caznik.athletedna.application.port.in;

import java.util.UUID;

public interface ChangePasswordUseCase {
	// Replaces the user's password after verifying the current one. Throws
	// InvalidPasswordException when the current password is wrong or the new one
	// is too short.
	void changePassword(UUID userId, String currentPassword, String newPassword);
}
