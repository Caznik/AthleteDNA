package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.PasswordHasher;
import com.caznik.athletedna.application.auth.EmailAlreadyRegisteredException;
import com.caznik.athletedna.application.auth.InvalidRegistrationException;
import com.caznik.athletedna.application.auth.UsernameAlreadyTakenException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class RegisterUserServiceTest {

	private UserRepository userRepository;
	private PasswordHasher passwordHasher;
	private RegisterUserService service;

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		passwordHasher = mock(PasswordHasher.class);
		service = new RegisterUserService(userRepository, passwordHasher);
		when(passwordHasher.hash(any())).thenReturn("hashed");
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
		when(userRepository.findByUsername(any())).thenReturn(Optional.empty());
	}

	@Test
	void register_normalizesEmailAndStoresHashedPassword() {
		User result = service.register("  User@Example.COM ", "  rider42 ", "supersecret");

		assertThat(result.getEmail()).isEqualTo("user@example.com");
		assertThat(result.getUsername()).isEqualTo("rider42");
		assertThat(result.getPasswordHash()).isEqualTo("hashed");
		assertThat(result.getId()).isNotNull();
		verify(passwordHasher).hash("supersecret");
	}

	@Test
	void register_rejectsInvalidEmail() {
		assertThatThrownBy(() -> service.register("not-an-email", "rider42", "supersecret"))
			.isInstanceOf(InvalidRegistrationException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void register_rejectsBlankUsername() {
		assertThatThrownBy(() -> service.register("user@example.com", "   ", "supersecret"))
			.isInstanceOf(InvalidRegistrationException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void register_rejectsUsernameLongerThan15() {
		assertThatThrownBy(() -> service.register("user@example.com", "abcdefghijklmnop", "supersecret"))
			.isInstanceOf(InvalidRegistrationException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void register_rejectsShortPassword() {
		assertThatThrownBy(() -> service.register("user@example.com", "rider42", "short"))
			.isInstanceOf(InvalidRegistrationException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void register_rejectsDuplicateEmail() {
		when(userRepository.findByEmail("user@example.com"))
			.thenReturn(Optional.of(new User(UUID.randomUUID(), "user@example.com", "rider42", "hashed")));

		assertThatThrownBy(() -> service.register("user@example.com", "rider42", "supersecret"))
			.isInstanceOf(EmailAlreadyRegisteredException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void register_rejectsDuplicateUsername() {
		when(userRepository.findByUsername("rider42"))
			.thenReturn(Optional.of(new User(UUID.randomUUID(), "other@example.com", "rider42", "hashed")));

		assertThatThrownBy(() -> service.register("user@example.com", "rider42", "supersecret"))
			.isInstanceOf(UsernameAlreadyTakenException.class);
		verify(userRepository, never()).save(any());
	}
}
