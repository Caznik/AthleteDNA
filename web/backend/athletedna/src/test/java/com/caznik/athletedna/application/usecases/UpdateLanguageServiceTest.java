package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.caznik.athletedna.application.auth.InvalidLanguageException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class UpdateLanguageServiceTest {

	private UserRepository userRepository;
	private UpdateLanguageService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		service = new UpdateLanguageService(userRepository);
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userRepository.findById(userId))
			.thenReturn(Optional.of(new User(userId, "user@example.com", "name", "hashed")));
	}

	@ParameterizedTest
	@ValueSource(strings = {"en", "es"})
	void updateLanguage_persistsEachAllowedValue(String language) {
		User result = service.updateLanguage(userId, language);

		assertThat(result.getLanguagePreference()).isEqualTo(language);
		verify(userRepository).save(argThat(u -> language.equals(u.getLanguagePreference())));
	}

	@Test
	void updateLanguage_trimsBeforeValidating() {
		User result = service.updateLanguage(userId, "  es ");

		assertThat(result.getLanguagePreference()).isEqualTo("es");
	}

	@Test
	void updateLanguage_unchangedValueIsNoOp() {
		User stored = new User(userId, "user@example.com", "name", "hashed");
		stored.setLanguagePreference("es");
		when(userRepository.findById(userId)).thenReturn(Optional.of(stored));

		User result = service.updateLanguage(userId, "es");

		assertThat(result.getLanguagePreference()).isEqualTo("es");
		verify(userRepository, never()).save(any());
	}

	@ParameterizedTest
	@ValueSource(strings = {"fr", "EN", "ES", "english"})
	void updateLanguage_rejectsUnknownValue(String language) {
		assertThatThrownBy(() -> service.updateLanguage(userId, language))
			.isInstanceOf(InvalidLanguageException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateLanguage_rejectsBlank() {
		assertThatThrownBy(() -> service.updateLanguage(userId, "   "))
			.isInstanceOf(InvalidLanguageException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateLanguage_rejectsNull() {
		assertThatThrownBy(() -> service.updateLanguage(userId, null))
			.isInstanceOf(InvalidLanguageException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateLanguage_rejectsUnknownUser() {
		UUID ghost = UUID.randomUUID();
		when(userRepository.findById(ghost)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.updateLanguage(ghost, "es"))
			.isInstanceOf(UnauthenticatedException.class);
		verify(userRepository, never()).save(any());
	}
}
