package com.caznik.athletedna.application.auth;

// Thrown when registration is attempted with an email that already exists.
public class EmailAlreadyRegisteredException extends RuntimeException {
	public EmailAlreadyRegisteredException(String email) {
		super("Email already registered: " + email);
	}
}
