package com.caznik.athletedna.infrastructure.insight;

// Raised when the insight engine is unreachable or returns an error/empty body.
// Mapped to HTTP 503 by InsightExceptionHandler so the rest of the app is unaffected.
public class InsightEngineException extends RuntimeException {

	public InsightEngineException(String message) {
		super(message);
	}

	public InsightEngineException(String message, Throwable cause) {
		super(message, cause);
	}
}
