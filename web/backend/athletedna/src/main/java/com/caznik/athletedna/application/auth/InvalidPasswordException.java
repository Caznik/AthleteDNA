package com.caznik.athletedna.application.auth;

// Thrown when a password change fails: the supplied current password is wrong,
// or the new password does not meet the strength requirement.
public class InvalidPasswordException extends RuntimeException {
	public InvalidPasswordException(String message) {
		super(message);
	}
}
