package com.caznik.athletedna.application.strava;

public class InvalidOAuthStateException extends RuntimeException {
	public InvalidOAuthStateException(String message) {
		super(message);
	}
}
