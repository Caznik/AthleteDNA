package com.caznik.athletedna.application.auth;

// Thrown when a profile photo upload fails validation: an unsupported content
// type or a payload above the size limit. Carries a human-readable message that
// the web layer relays to the client as a 400.
public class InvalidPhotoException extends RuntimeException {
	public InvalidPhotoException(String message) {
		super(message);
	}
}
