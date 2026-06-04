package com.caznik.athletedna.application.auth;

// Thrown when a username update fails validation (blank or too long).
public class InvalidUsernameException extends RuntimeException {
	public InvalidUsernameException(String message) {
		super(message);
	}
}
