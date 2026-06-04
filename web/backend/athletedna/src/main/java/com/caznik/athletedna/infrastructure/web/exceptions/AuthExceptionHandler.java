package com.caznik.athletedna.infrastructure.web.exceptions;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.caznik.athletedna.application.auth.EmailAlreadyRegisteredException;
import com.caznik.athletedna.application.auth.InvalidCredentialsException;
import com.caznik.athletedna.application.auth.InvalidPasswordException;
import com.caznik.athletedna.application.auth.InvalidPhotoException;
import com.caznik.athletedna.application.auth.InvalidRegistrationException;
import com.caznik.athletedna.application.auth.InvalidUsernameException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.auth.UsernameAlreadyTakenException;

import io.jsonwebtoken.JwtException;

@RestControllerAdvice
public class AuthExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(AuthExceptionHandler.class);

	@ExceptionHandler(InvalidRegistrationException.class)
	public ResponseEntity<Map<String, String>> handleInvalidRegistration(InvalidRegistrationException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(Map.of("error", "invalid_registration", "message", ex.getMessage()));
	}

	@ExceptionHandler(EmailAlreadyRegisteredException.class)
	public ResponseEntity<Map<String, String>> handleEmailTaken(EmailAlreadyRegisteredException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(Map.of("error", "email_already_registered", "message", "That email is already registered"));
	}

	@ExceptionHandler(UsernameAlreadyTakenException.class)
	public ResponseEntity<Map<String, String>> handleUsernameTaken(UsernameAlreadyTakenException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(Map.of("error", "username_already_taken", "message", "That username is already taken"));
	}

	@ExceptionHandler(InvalidUsernameException.class)
	public ResponseEntity<Map<String, String>> handleInvalidUsername(InvalidUsernameException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(Map.of("error", "invalid_username", "message", ex.getMessage()));
	}

	@ExceptionHandler(InvalidPasswordException.class)
	public ResponseEntity<Map<String, String>> handleInvalidPassword(InvalidPasswordException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(Map.of("error", "invalid_password", "message", ex.getMessage()));
	}

	@ExceptionHandler(InvalidPhotoException.class)
	public ResponseEntity<Map<String, String>> handleInvalidPhoto(InvalidPhotoException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(Map.of("error", "invalid_photo", "message", ex.getMessage()));
	}

	// Fallback when the upload exceeds the container's multipart limit before our
	// use case can run. The container limit is set above our 2 MB rule so the use
	// case normally returns the cleaner message; this keeps the contract a 400 even
	// for grossly oversized payloads.
	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, String>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(Map.of("error", "invalid_photo", "message", "Image is too large. Maximum size is 2 MB"));
	}

	// Bad credentials, an invalid/expired JWT, and a missing session all collapse
	// to a generic 401 so responses never leak why authentication failed.
	@ExceptionHandler({
		InvalidCredentialsException.class,
		UnauthenticatedException.class,
		JwtException.class
	})
	public ResponseEntity<Map<String, String>> handleUnauthorized(RuntimeException ex) {
		// Debug only and without any message: failed auth is routine and the cause
		// (bad password vs. expired token) must not leak into logs either.
		log.debug("Request rejected as unauthorized ({})", ex.getClass().getSimpleName());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
			.body(Map.of("error", "unauthorized", "message", "Authentication required"));
	}
}
