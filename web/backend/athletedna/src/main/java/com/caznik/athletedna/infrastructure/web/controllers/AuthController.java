package com.caznik.athletedna.infrastructure.web.controllers;

import java.io.IOException;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.auth.InvalidPhotoException;
import com.caznik.athletedna.application.port.in.AuthenticateUserUseCase;
import com.caznik.athletedna.application.port.in.ChangePasswordUseCase;
import com.caznik.athletedna.application.port.in.RegisterUserUseCase;
import com.caznik.athletedna.application.port.in.UpdateProfilePhotoUseCase;
import com.caznik.athletedna.application.port.in.UpdateUsernameUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.endpoints.Endpoints;
import com.caznik.athletedna.infrastructure.auth.JwtTokenService;
import com.caznik.athletedna.infrastructure.web.dtos.AuthResponse;
import com.caznik.athletedna.infrastructure.web.dtos.ChangePasswordRequest;
import com.caznik.athletedna.infrastructure.web.dtos.LoginRequest;
import com.caznik.athletedna.infrastructure.web.dtos.RegisterRequest;
import com.caznik.athletedna.infrastructure.web.dtos.UpdateUsernameRequest;
import com.caznik.athletedna.infrastructure.web.dtos.UserResponse;

@RestController
@Profile("jpa")
public class AuthController {

	private final RegisterUserUseCase registerUserUseCase;
	private final AuthenticateUserUseCase authenticateUserUseCase;
	private final UpdateUsernameUseCase updateUsernameUseCase;
	private final ChangePasswordUseCase changePasswordUseCase;
	private final UpdateProfilePhotoUseCase updateProfilePhotoUseCase;
	private final JwtTokenService jwtTokenService;
	private final CurrentUserProvider currentUserProvider;

	public AuthController(
		RegisterUserUseCase registerUserUseCase,
		AuthenticateUserUseCase authenticateUserUseCase,
		UpdateUsernameUseCase updateUsernameUseCase,
		ChangePasswordUseCase changePasswordUseCase,
		UpdateProfilePhotoUseCase updateProfilePhotoUseCase,
		JwtTokenService jwtTokenService,
		CurrentUserProvider currentUserProvider
	) {
		this.registerUserUseCase = registerUserUseCase;
		this.authenticateUserUseCase = authenticateUserUseCase;
		this.updateUsernameUseCase = updateUsernameUseCase;
		this.changePasswordUseCase = changePasswordUseCase;
		this.updateProfilePhotoUseCase = updateProfilePhotoUseCase;
		this.jwtTokenService = jwtTokenService;
		this.currentUserProvider = currentUserProvider;
	}

	@PostMapping(Endpoints.AUTH_ENDPOINT + "/register")
	public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
		User user = registerUserUseCase.register(
			request.email(), request.username(), request.password());
		return ResponseEntity.status(HttpStatus.CREATED).body(toAuthResponse(user));
	}

	@PostMapping(Endpoints.AUTH_ENDPOINT + "/login")
	public AuthResponse login(@RequestBody LoginRequest request) {
		User user = authenticateUserUseCase.authenticate(request.email(), request.password());
		return toAuthResponse(user);
	}

	@GetMapping(Endpoints.AUTH_ENDPOINT + "/me")
	public UserResponse me() {
		// The JWT filter + CurrentUserProvider resolve the caller; an absent or
		// invalid token surfaces as UnauthenticatedException → 401.
		User user = currentUserProvider.current();
		return toUserResponse(user);
	}

	@PatchMapping(Endpoints.AUTH_ENDPOINT + "/me")
	public UserResponse updateUsername(@RequestBody UpdateUsernameRequest request) {
		User current = currentUserProvider.current();
		User updated = updateUsernameUseCase.updateUsername(current.getId(), request.username());
		return toUserResponse(updated);
	}

	@PutMapping(Endpoints.AUTH_ENDPOINT + "/me/password")
	public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request) {
		User current = currentUserProvider.current();
		changePasswordUseCase.changePassword(
			current.getId(), request.currentPassword(), request.newPassword());
		return ResponseEntity.noContent().build();
	}

	@PutMapping(value = Endpoints.AUTH_ENDPOINT + "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public UserResponse uploadPhoto(@RequestParam("file") MultipartFile file) {
		User current = currentUserProvider.current();
		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (IOException ex) {
			throw new InvalidPhotoException("Could not read the uploaded file");
		}
		User updated = updateProfilePhotoUseCase.updatePhoto(
			current.getId(), bytes, file.getContentType());
		return toUserResponse(updated);
	}

	@DeleteMapping(Endpoints.AUTH_ENDPOINT + "/me/photo")
	public UserResponse removePhoto() {
		User current = currentUserProvider.current();
		User updated = updateProfilePhotoUseCase.removePhoto(current.getId());
		return toUserResponse(updated);
	}

	@GetMapping(Endpoints.AUTH_ENDPOINT + "/me/photo")
	public ResponseEntity<byte[]> getPhoto() {
		User user = currentUserProvider.current();
		if (user.getPhoto() == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(user.getPhotoContentType()))
			// The frontend appends a ?v=<photoUpdatedAt> token, so the URL changes
			// whenever the photo does; a private cache is then safe and avoids a
			// refetch on every avatar render within a session.
			.header("Cache-Control", "private, max-age=3600")
			.body(user.getPhoto());
	}

	private UserResponse toUserResponse(User user) {
		return new UserResponse(
			user.getId(), user.getEmail(), user.getUsername(), photoUpdatedAtMillis(user));
	}

	private AuthResponse toAuthResponse(User user) {
		return new AuthResponse(
			jwtTokenService.issue(user),
			jwtTokenService.expirationSeconds(),
			user.getId(),
			user.getEmail(),
			user.getUsername(),
			photoUpdatedAtMillis(user)
		);
	}

	private static Long photoUpdatedAtMillis(User user) {
		return user.getPhotoUpdatedAt() == null ? null : user.getPhotoUpdatedAt().toEpochMilli();
	}
}
