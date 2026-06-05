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

import com.caznik.athletedna.application.auth.InvalidThemeException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class UpdateThemeServiceTest {

	private UserRepository userRepository;
	private UpdateThemeService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		service = new UpdateThemeService(userRepository);
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userRepository.findById(userId))
			.thenReturn(Optional.of(new User(userId, "user@example.com", "name", "hashed")));
	}

	@ParameterizedTest
	@ValueSource(strings = {"light", "dark", "system"})
	void updateTheme_persistsEachAllowedValue(String theme) {
		User result = service.updateTheme(userId, theme);

		assertThat(result.getThemePreference()).isEqualTo(theme);
		verify(userRepository).save(argThat(u -> theme.equals(u.getThemePreference())));
	}

	@Test
	void updateTheme_trimsBeforeValidating() {
		User result = service.updateTheme(userId, "  dark ");

		assertThat(result.getThemePreference()).isEqualTo("dark");
	}

	@Test
	void updateTheme_unchangedValueIsNoOp() {
		User stored = new User(userId, "user@example.com", "name", "hashed");
		stored.setThemePreference("dark");
		when(userRepository.findById(userId)).thenReturn(Optional.of(stored));

		User result = service.updateTheme(userId, "dark");

		assertThat(result.getThemePreference()).isEqualTo("dark");
		verify(userRepository, never()).save(any());
	}

	@ParameterizedTest
	@ValueSource(strings = {"blue", "Light", "DARK", "auto"})
	void updateTheme_rejectsUnknownValue(String theme) {
		assertThatThrownBy(() -> service.updateTheme(userId, theme))
			.isInstanceOf(InvalidThemeException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateTheme_rejectsBlank() {
		assertThatThrownBy(() -> service.updateTheme(userId, "   "))
			.isInstanceOf(InvalidThemeException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateTheme_rejectsNull() {
		assertThatThrownBy(() -> service.updateTheme(userId, null))
			.isInstanceOf(InvalidThemeException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateTheme_rejectsUnknownUser() {
		UUID ghost = UUID.randomUUID();
		when(userRepository.findById(ghost)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.updateTheme(ghost, "dark"))
			.isInstanceOf(UnauthenticatedException.class);
		verify(userRepository, never()).save(any());
	}
}
