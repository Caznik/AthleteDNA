package com.caznik.athletedna.application.auth;

// Thrown when registration input fails validation (bad email, weak password).
public class InvalidRegistrationException extends RuntimeException {
	public InvalidRegistrationException(String message) {
		super(message);
	}
}
