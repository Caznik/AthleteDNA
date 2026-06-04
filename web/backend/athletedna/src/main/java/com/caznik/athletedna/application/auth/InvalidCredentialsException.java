package com.caznik.athletedna.application.auth;

// Thrown when login fails. Intentionally generic so the response never reveals
// whether it was the email or the password that was wrong.
public class InvalidCredentialsException extends RuntimeException {
	public InvalidCredentialsException() {
		super("Invalid email or password");
	}
}
