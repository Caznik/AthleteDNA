package com.caznik.athletedna.infrastructure.web.exceptions;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.caznik.athletedna.application.auth.InvalidLanguageException;

class AuthExceptionHandlerTest {

	private final AuthExceptionHandler handler = new AuthExceptionHandler();

	@Test
	void invalidLanguage_maps400WithStableCode() {
		ResponseEntity<Map<String, String>> response =
			handler.handleInvalidLanguage(new InvalidLanguageException("Language must be one of en or es"));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
		assertThat(response.getBody()).containsEntry("error", "invalid_language");
		assertThat(response.getBody().get("message")).isEqualTo("Language must be one of en or es");
	}
}
