package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.PasswordHasher;
import com.caznik.athletedna.application.auth.InvalidCredentialsException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class AuthenticateUserServiceTest {

	private UserRepository userRepository;
	private PasswordHasher passwordHasher;
	private AuthenticateUserService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		passwordHasher = mock(PasswordHasher.class);
		service = new AuthenticateUserService(userRepository, passwordHasher);
	}

	@Test
	void authenticate_returnsUserOnMatchingPassword() {
		User user = new User(userId, "user@example.com", "hashed");
		when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
		when(passwordHasher.matches("supersecret", "hashed")).thenReturn(true);

		assertThat(service.authenticate("  User@Example.COM ", "supersecret")).isSameAs(user);
	}

	@Test
	void authenticate_rejectsUnknownEmail() {
		when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.authenticate("user@example.com", "supersecret"))
			.isInstanceOf(InvalidCredentialsException.class);
	}

	@Test
	void authenticate_rejectsWrongPassword() {
		User user = new User(userId, "user@example.com", "hashed");
		when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
		when(passwordHasher.matches("wrong", "hashed")).thenReturn(false);

		assertThatThrownBy(() -> service.authenticate("user@example.com", "wrong"))
			.isInstanceOf(InvalidCredentialsException.class);
	}

	@Test
	void authenticate_rejectsUserWithoutPassword() {
		User stub = new User(userId, "dev@athletedna.local", null);
		when(userRepository.findByEmail("dev@athletedna.local")).thenReturn(Optional.of(stub));

		assertThatThrownBy(() -> service.authenticate("dev@athletedna.local", "whatever"))
			.isInstanceOf(InvalidCredentialsException.class);
	}
}
