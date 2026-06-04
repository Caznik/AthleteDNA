package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.PasswordHasher;
import com.caznik.athletedna.application.auth.InvalidPasswordException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class ChangePasswordServiceTest {

	private UserRepository userRepository;
	private PasswordHasher passwordHasher;
	private ChangePasswordService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		passwordHasher = mock(PasswordHasher.class);
		service = new ChangePasswordService(userRepository, passwordHasher);
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userRepository.findById(userId))
			.thenReturn(Optional.of(new User(userId, "user@example.com", "rider42", "old-hash")));
		when(passwordHasher.matches("correct-current", "old-hash")).thenReturn(true);
		when(passwordHasher.hash("brand-new-pass")).thenReturn("new-hash");
	}

	@Test
	void changePassword_hashesAndStoresNewPassword() {
		service.changePassword(userId, "correct-current", "brand-new-pass");

		verify(passwordHasher).hash("brand-new-pass");
		verify(userRepository).save(argThat(u -> u.getPasswordHash().equals("new-hash")));
	}

	@Test
	void changePassword_rejectsWrongCurrentPassword() {
		when(passwordHasher.matches(eq("wrong"), any())).thenReturn(false);

		assertThatThrownBy(() -> service.changePassword(userId, "wrong", "brand-new-pass"))
			.isInstanceOf(InvalidPasswordException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void changePassword_rejectsShortNewPassword() {
		assertThatThrownBy(() -> service.changePassword(userId, "correct-current", "short"))
			.isInstanceOf(InvalidPasswordException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void changePassword_rejectsUserWithoutPasswordHash() {
		UUID stubId = UUID.randomUUID();
		when(userRepository.findById(stubId))
			.thenReturn(Optional.of(new User(stubId, "stub@example.com")));

		assertThatThrownBy(() -> service.changePassword(stubId, "anything", "brand-new-pass"))
			.isInstanceOf(InvalidPasswordException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void changePassword_rejectsUnknownUser() {
		UUID ghost = UUID.randomUUID();
		when(userRepository.findById(ghost)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.changePassword(ghost, "correct-current", "brand-new-pass"))
			.isInstanceOf(UnauthenticatedException.class);
	}
}
