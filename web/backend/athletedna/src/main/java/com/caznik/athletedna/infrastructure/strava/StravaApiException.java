package com.caznik.athletedna.infrastructure.strava;

public class StravaApiException extends RuntimeException {
	public StravaApiException(String message) {
		super(message);
	}

	public StravaApiException(String message, Throwable cause) {
		super(message, cause);
	}
}
