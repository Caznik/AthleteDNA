package com.caznik.athletedna.application.auth;

// Thrown when a language update carries a value other than en/es.
public class InvalidLanguageException extends RuntimeException {
	public InvalidLanguageException(String message) {
		super(message);
	}
}
