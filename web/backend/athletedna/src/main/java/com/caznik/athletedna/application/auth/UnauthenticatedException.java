package com.caznik.athletedna.application.auth;

// Thrown when an operation needs a logged-in user but the request carries no
// valid session (missing/invalid/expired token, or the user no longer exists).
public class UnauthenticatedException extends RuntimeException {
	public UnauthenticatedException() {
		super("Authentication required");
	}
}
