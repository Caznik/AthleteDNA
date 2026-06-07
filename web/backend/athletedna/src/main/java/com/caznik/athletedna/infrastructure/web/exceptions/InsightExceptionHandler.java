package com.caznik.athletedna.infrastructure.web.exceptions;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.caznik.athletedna.infrastructure.insight.InsightEngineException;

@RestControllerAdvice
public class InsightExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(InsightExceptionHandler.class);

	@ExceptionHandler(InsightEngineException.class)
	public ResponseEntity<Map<String, String>> handleEngineUnavailable(InsightEngineException ex) {
		// Engine down/unreachable -> 503; the rest of the app keeps working. Log with the
		// cause so the root problem (timeout, connection refused, bad body) is recoverable.
		log.error("Insight engine call failed -> 503", ex);
		return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
			.body(Map.of("error", "insights_unavailable", "message", ex.getMessage()));
	}
}
