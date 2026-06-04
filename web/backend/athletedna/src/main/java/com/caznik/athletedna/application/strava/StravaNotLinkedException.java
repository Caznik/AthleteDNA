package com.caznik.athletedna.application.strava;

public class StravaNotLinkedException extends RuntimeException {
	public StravaNotLinkedException(String message) {
		super(message);
	}
}
