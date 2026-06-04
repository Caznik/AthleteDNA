package com.caznik.athletedna.application.port.in;

import com.caznik.athletedna.domain.model.User;

public interface AuthenticateUserUseCase {
	// Verifies the credentials and returns the matching user, or throws
	// InvalidCredentialsException. Token issuance is the web layer's concern.
	User authenticate(String email, String rawPassword);
}
