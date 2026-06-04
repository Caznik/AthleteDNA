package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.auth.InvalidUsernameException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.auth.UsernameAlreadyTakenException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class UpdateUsernameServiceTest {

	private UserRepository userRepository;
	private UpdateUsernameService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		service = new UpdateUsernameService(userRepository);
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userRepository.findByUsername(any())).thenReturn(Optional.empty());
		when(userRepository.findById(userId))
			.thenReturn(Optional.of(new User(userId, "user@example.com", "oldname", "hashed")));
	}

	@Test
	void updateUsername_trimsAndPersistsNewHandle() {
		User result = service.updateUsername(userId, "  newname ");

		assertThat(result.getUsername()).isEqualTo("newname");
		verify(userRepository).save(argThat(u -> u.getUsername().equals("newname")));
	}

	@Test
	void updateUsername_rejectsBlank() {
		assertThatThrownBy(() -> service.updateUsername(userId, "   "))
			.isInstanceOf(InvalidUsernameException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateUsername_rejectsLongerThan15() {
		assertThatThrownBy(() -> service.updateUsername(userId, "abcdefghijklmnop"))
			.isInstanceOf(InvalidUsernameException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateUsername_unchangedHandleIsNoOp() {
		User result = service.updateUsername(userId, "oldname");

		assertThat(result.getUsername()).isEqualTo("oldname");
		verify(userRepository, never()).save(any());
		// The unchanged path must not even probe for a conflict.
		verify(userRepository, never()).findByUsername(any());
	}

	@Test
	void updateUsername_allowsReclaimingOwnHandleDifferentCase() {
		// Same user already holds the target handle → not a conflict.
		when(userRepository.findByUsername("newname"))
			.thenReturn(Optional.of(new User(userId, "user@example.com", "newname", "hashed")));

		User result = service.updateUsername(userId, "newname");

		assertThat(result.getUsername()).isEqualTo("newname");
		verify(userRepository).save(any());
	}

	@Test
	void updateUsername_rejectsHandleOwnedByAnotherUser() {
		when(userRepository.findByUsername("taken"))
			.thenReturn(Optional.of(new User(UUID.randomUUID(), "other@example.com", "taken", "hashed")));

		assertThatThrownBy(() -> service.updateUsername(userId, "taken"))
			.isInstanceOf(UsernameAlreadyTakenException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updateUsername_rejectsUnknownUser() {
		UUID ghost = UUID.randomUUID();
		when(userRepository.findById(ghost)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.updateUsername(ghost, "newname"))
			.isInstanceOf(UnauthenticatedException.class);
	}
}
