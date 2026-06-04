package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.auth.InvalidPhotoException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class UpdateProfilePhotoServiceTest {

	private UserRepository userRepository;
	private UpdateProfilePhotoService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		service = new UpdateProfilePhotoService(userRepository);
		when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
		when(userRepository.findById(userId))
			.thenReturn(Optional.of(new User(userId, "user@example.com", "name", "hashed")));
	}

	private static byte[] bytes(int size) {
		return new byte[size];
	}

	@Test
	void updatePhoto_storesBytesTypeAndTimestamp() {
		byte[] image = new byte[] {1, 2, 3, 4};

		User result = service.updatePhoto(userId, image, "image/png");

		assertThat(result.getPhoto()).isEqualTo(image);
		assertThat(result.getPhotoContentType()).isEqualTo("image/png");
		assertThat(result.getPhotoUpdatedAt()).isNotNull();
		verify(userRepository).save(any());
	}

	@Test
	void updatePhoto_replaceOverwritesExistingPhoto() {
		User existing = new User(userId, "user@example.com", "name", "hashed");
		existing.setPhoto(new byte[] {9, 9});
		existing.setPhotoContentType("image/jpeg");
		when(userRepository.findById(userId)).thenReturn(Optional.of(existing));

		byte[] replacement = new byte[] {5, 6, 7};
		User result = service.updatePhoto(userId, replacement, "image/webp");

		assertThat(result.getPhoto()).isEqualTo(replacement);
		assertThat(result.getPhotoContentType()).isEqualTo("image/webp");
	}

	@Test
	void updatePhoto_acceptsJpegPngWebp() {
		for (String type : new String[] {"image/jpeg", "image/png", "image/webp"}) {
			User result = service.updatePhoto(userId, bytes(10), type);
			assertThat(result.getPhotoContentType()).isEqualTo(type);
		}
	}

	@Test
	void updatePhoto_rejectsUnsupportedType() {
		assertThatThrownBy(() -> service.updatePhoto(userId, bytes(10), "image/gif"))
			.isInstanceOf(InvalidPhotoException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updatePhoto_rejectsNullType() {
		assertThatThrownBy(() -> service.updatePhoto(userId, bytes(10), null))
			.isInstanceOf(InvalidPhotoException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updatePhoto_rejectsEmptyBytes() {
		assertThatThrownBy(() -> service.updatePhoto(userId, new byte[0], "image/png"))
			.isInstanceOf(InvalidPhotoException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updatePhoto_rejectsOversize() {
		// 2 MB + 1 byte exceeds the 2 MB limit.
		assertThatThrownBy(() -> service.updatePhoto(userId, bytes(2 * 1024 * 1024 + 1), "image/png"))
			.isInstanceOf(InvalidPhotoException.class);
		verify(userRepository, never()).save(any());
	}

	@Test
	void updatePhoto_acceptsExactlyAtLimit() {
		User result = service.updatePhoto(userId, bytes(2 * 1024 * 1024), "image/png");
		assertThat(result.getPhoto()).hasSize(2 * 1024 * 1024);
	}

	@Test
	void updatePhoto_rejectsUnknownUser() {
		UUID ghost = UUID.randomUUID();
		when(userRepository.findById(ghost)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.updatePhoto(ghost, bytes(10), "image/png"))
			.isInstanceOf(UnauthenticatedException.class);
	}

	@Test
	void removePhoto_clearsAllThreeFields() {
		User existing = new User(userId, "user@example.com", "name", "hashed");
		existing.setPhoto(new byte[] {1, 2});
		existing.setPhotoContentType("image/png");
		existing.setPhotoUpdatedAt(java.time.Instant.now());
		when(userRepository.findById(userId)).thenReturn(Optional.of(existing));

		User result = service.removePhoto(userId);

		assertThat(result.getPhoto()).isNull();
		assertThat(result.getPhotoContentType()).isNull();
		assertThat(result.getPhotoUpdatedAt()).isNull();
		verify(userRepository).save(any());
	}

	@Test
	void removePhoto_rejectsUnknownUser() {
		UUID ghost = UUID.randomUUID();
		when(userRepository.findById(ghost)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.removePhoto(ghost))
			.isInstanceOf(UnauthenticatedException.class);
	}
}
