package com.caznik.athletedna.infrastructure.web.exceptions;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.caznik.athletedna.application.strava.InvalidOAuthStateException;
import com.caznik.athletedna.application.strava.StravaNotLinkedException;
import com.caznik.athletedna.infrastructure.strava.StravaApiException;

@RestControllerAdvice
public class StravaExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(StravaExceptionHandler.class);

	@ExceptionHandler(InvalidOAuthStateException.class)
	public ResponseEntity<Map<String, String>> handleInvalidState(InvalidOAuthStateException ex) {
		log.debug("Strava OAuth state rejected: {}", ex.getMessage());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(Map.of("error", "invalid_state", "message", ex.getMessage()));
	}

	@ExceptionHandler(StravaNotLinkedException.class)
	public ResponseEntity<Map<String, String>> handleNotLinked(StravaNotLinkedException ex) {
		log.debug("Strava action on an unlinked account: {}", ex.getMessage());
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(Map.of("error", "strava_not_linked", "message", ex.getMessage()));
	}

	@ExceptionHandler(StravaApiException.class)
	public ResponseEntity<Map<String, String>> handleStravaApi(StravaApiException ex) {
		// Upstream Strava failure -> 502. Log at error with the cause so the root
		// problem (timeout, 401, malformed body) is recoverable from the logs.
		log.error("Strava API call failed -> 502", ex);
		return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
			.body(Map.of("error", "strava_api_error", "message", ex.getMessage()));
	}
}
