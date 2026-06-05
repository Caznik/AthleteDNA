package com.caznik.athletedna.application.auth;

// Thrown when a theme update carries a value other than light/dark/system.
public class InvalidThemeException extends RuntimeException {
	public InvalidThemeException(String message) {
		super(message);
	}
}
