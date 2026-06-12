package com.caznik.athletedna.infrastructure.web.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.AuthenticateUserUseCase;
import com.caznik.athletedna.application.port.in.ChangePasswordUseCase;
import com.caznik.athletedna.application.port.in.RegisterUserUseCase;
import com.caznik.athletedna.application.port.in.UpdateLanguageUseCase;
import com.caznik.athletedna.application.port.in.UpdateProfilePhotoUseCase;
import com.caznik.athletedna.application.port.in.UpdateThemeUseCase;
import com.caznik.athletedna.application.port.in.UpdateUsernameUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.infrastructure.auth.JwtTokenService;
import com.caznik.athletedna.infrastructure.web.dtos.UpdateLanguageRequest;
import com.caznik.athletedna.infrastructure.web.dtos.UpdateThemeRequest;
import com.caznik.athletedna.infrastructure.web.dtos.UserResponse;

class AuthControllerTest {

	private RegisterUserUseCase register;
	private AuthenticateUserUseCase authenticate;
	private UpdateUsernameUseCase updateUsername;
	private ChangePasswordUseCase changePassword;
	private UpdateProfilePhotoUseCase updatePhoto;
	private UpdateThemeUseCase updateTheme;
	private UpdateLanguageUseCase updateLanguage;
	private JwtTokenService jwtTokenService;
	private CurrentUserProvider currentUserProvider;
	private AuthController controller;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		register = mock(RegisterUserUseCase.class);
		authenticate = mock(AuthenticateUserUseCase.class);
		updateUsername = mock(UpdateUsernameUseCase.class);
		changePassword = mock(ChangePasswordUseCase.class);
		updatePhoto = mock(UpdateProfilePhotoUseCase.class);
		updateTheme = mock(UpdateThemeUseCase.class);
		updateLanguage = mock(UpdateLanguageUseCase.class);
		jwtTokenService = mock(JwtTokenService.class);
		currentUserProvider = mock(CurrentUserProvider.class);
		controller = new AuthController(
			register, authenticate, updateUsername, changePassword,
			updatePhoto, updateTheme, updateLanguage, jwtTokenService, currentUserProvider);

		when(currentUserProvider.current())
			.thenReturn(new User(userId, "user@example.com", "name", "hashed"));
	}

	@Test
	void uploadPhoto_returnsPhotoUpdatedAt() throws Exception {
		Instant ts = Instant.ofEpochMilli(1_700_000_000_000L);
		User updated = new User(userId, "user@example.com", "name", "hashed");
		updated.setPhoto(new byte[] {1, 2, 3});
		updated.setPhotoContentType("image/png");
		updated.setPhotoUpdatedAt(ts);
		when(updatePhoto.updatePhoto(eq(userId), any(), eq("image/png"))).thenReturn(updated);

		MockMultipartFile file = new MockMultipartFile(
			"file", "a.png", "image/png", new byte[] {1, 2, 3});

		UserResponse response = controller.uploadPhoto(file);

		assertThat(response.photoUpdatedAt()).isEqualTo(ts.toEpochMilli());
		verify(updatePhoto).updatePhoto(eq(userId), any(), eq("image/png"));
	}

	@Test
	void uploadPhoto_unauthenticatedThrows() {
		when(currentUserProvider.current()).thenThrow(new UnauthenticatedException());

		MockMultipartFile file = new MockMultipartFile(
			"file", "a.png", "image/png", new byte[] {1});

		assertThatThrownBy(() -> controller.uploadPhoto(file))
			.isInstanceOf(UnauthenticatedException.class);
		verifyNoInteractions(updatePhoto);
	}

	@Test
	void removePhoto_returnsNullPhotoUpdatedAt() {
		User cleared = new User(userId, "user@example.com", "name", "hashed");
		when(updatePhoto.removePhoto(userId)).thenReturn(cleared);

		UserResponse response = controller.removePhoto();

		assertThat(response.photoUpdatedAt()).isNull();
		verify(updatePhoto).removePhoto(userId);
	}

	@Test
	void removePhoto_unauthenticatedThrows() {
		when(currentUserProvider.current()).thenThrow(new UnauthenticatedException());

		assertThatThrownBy(() -> controller.removePhoto())
			.isInstanceOf(UnauthenticatedException.class);
		verifyNoInteractions(updatePhoto);
	}

	@Test
	void getPhoto_streamsBytesWithStoredContentType() {
		User withPhoto = new User(userId, "user@example.com", "name", "hashed");
		withPhoto.setPhoto(new byte[] {10, 20, 30});
		withPhoto.setPhotoContentType("image/webp");
		when(currentUserProvider.current()).thenReturn(withPhoto);

		ResponseEntity<byte[]> response = controller.getPhoto();

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).containsExactly(10, 20, 30);
		assertThat(response.getHeaders().getContentType())
			.isEqualTo(MediaType.parseMediaType("image/webp"));
	}

	@Test
	void getPhoto_returns404WhenNoPhoto() {
		ResponseEntity<byte[]> response = controller.getPhoto();

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
		assertThat(response.getBody()).isNull();
	}

	@Test
	void getPhoto_unauthenticatedThrows() {
		when(currentUserProvider.current()).thenThrow(new UnauthenticatedException());

		assertThatThrownBy(() -> controller.getPhoto())
			.isInstanceOf(UnauthenticatedException.class);
	}

	@Test
	void me_carriesPhotoUpdatedAtWhenPresent() {
		Instant ts = Instant.ofEpochMilli(1_700_000_000_000L);
		User withPhoto = new User(userId, "user@example.com", "name", "hashed");
		withPhoto.setPhotoUpdatedAt(ts);
		when(currentUserProvider.current()).thenReturn(withPhoto);

		UserResponse response = controller.me();

		assertThat(response.photoUpdatedAt()).isEqualTo(ts.toEpochMilli());
	}

	@Test
	void me_photoUpdatedAtNullWhenNoPhoto() {
		UserResponse response = controller.me();
		assertThat(response.photoUpdatedAt()).isNull();
	}

	@Test
	void me_coercesUnsetThemeToSystem() {
		// The seeded current user has a null themePreference.
		UserResponse response = controller.me();
		assertThat(response.themePreference()).isEqualTo("system");
	}

	@Test
	void updateTheme_returnsUpdatedThemePreference() {
		User updated = new User(userId, "user@example.com", "name", "hashed");
		updated.setThemePreference("dark");
		when(updateTheme.updateTheme(eq(userId), eq("dark"))).thenReturn(updated);

		UserResponse response = controller.updateTheme(new UpdateThemeRequest("dark"));

		assertThat(response.themePreference()).isEqualTo("dark");
		verify(updateTheme).updateTheme(eq(userId), eq("dark"));
	}

	@Test
	void updateTheme_unauthenticatedThrows() {
		when(currentUserProvider.current()).thenThrow(new UnauthenticatedException());

		assertThatThrownBy(() -> controller.updateTheme(new UpdateThemeRequest("dark")))
			.isInstanceOf(UnauthenticatedException.class);
		verifyNoInteractions(updateTheme);
	}

	@Test
	void me_coercesUnsetLanguageToEnglish() {
		// The seeded current user has a null languagePreference (AC-1).
		UserResponse response = controller.me();
		assertThat(response.languagePreference()).isEqualTo("en");
	}

	@Test
	void me_passesThroughStoredLanguage() {
		User withLanguage = new User(userId, "user@example.com", "name", "hashed");
		withLanguage.setLanguagePreference("es");
		when(currentUserProvider.current()).thenReturn(withLanguage);

		UserResponse response = controller.me();
		assertThat(response.languagePreference()).isEqualTo("es");
	}

	@Test
	void updateLanguage_returnsUpdatedLanguagePreference() {
		User updated = new User(userId, "user@example.com", "name", "hashed");
		updated.setLanguagePreference("es");
		when(updateLanguage.updateLanguage(eq(userId), eq("es"))).thenReturn(updated);

		UserResponse response = controller.updateLanguage(new UpdateLanguageRequest("es"));

		assertThat(response.languagePreference()).isEqualTo("es");
		verify(updateLanguage).updateLanguage(eq(userId), eq("es"));
	}

	@Test
	void updateLanguage_unauthenticatedThrows() {
		when(currentUserProvider.current()).thenThrow(new UnauthenticatedException());

		assertThatThrownBy(() -> controller.updateLanguage(new UpdateLanguageRequest("es")))
			.isInstanceOf(UnauthenticatedException.class);
		verifyNoInteractions(updateLanguage);
	}
}
