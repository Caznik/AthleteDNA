package com.caznik.athletedna.application.auth;

// Thrown when registration is attempted with a username that already exists.
public class UsernameAlreadyTakenException extends RuntimeException {
	public UsernameAlreadyTakenException(String username) {
		super("Username already taken: " + username);
	}
}
