package com.caznik.athletedna.application.port.in;

import com.caznik.athletedna.domain.model.User;

public interface RegisterUserUseCase {
	// Creates a new user with a hashed password. Throws
	// InvalidRegistrationException for bad input, EmailAlreadyRegisteredException
	// if the email is taken, and UsernameAlreadyTakenException if the username is.
	User register(String email, String username, String rawPassword);
}
