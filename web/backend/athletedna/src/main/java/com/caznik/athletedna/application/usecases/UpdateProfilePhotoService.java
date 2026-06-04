package com.caznik.athletedna.application.usecases;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.auth.InvalidPhotoException;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.UpdateProfilePhotoUseCase;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

@Service
@Profile("jpa")
public class UpdateProfilePhotoService implements UpdateProfilePhotoUseCase {

	// Allowlist mirrored on the client (the file input accept= and pre-check); the
	// backend remains the source of truth. GIF/SVG are intentionally excluded.
	private static final Set<String> ALLOWED_CONTENT_TYPES =
		Set.of("image/jpeg", "image/png", "image/webp");

	private static final int MAX_PHOTO_BYTES = 2 * 1024 * 1024;

	private final UserRepository userRepository;

	public UpdateProfilePhotoService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public User updatePhoto(UUID userId, byte[] bytes, String contentType) {
		if (bytes == null || bytes.length == 0) {
			throw new InvalidPhotoException("No image was provided");
		}
		if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
			throw new InvalidPhotoException("Unsupported image type. Use JPEG, PNG, or WebP");
		}
		if (bytes.length > MAX_PHOTO_BYTES) {
			throw new InvalidPhotoException("Image is too large. Maximum size is 2 MB");
		}

		User user = userRepository.findById(userId).orElseThrow(UnauthenticatedException::new);
		user.setPhoto(bytes);
		user.setPhotoContentType(contentType);
		user.setPhotoUpdatedAt(Instant.now());
		return userRepository.save(user);
	}

	@Override
	public User removePhoto(UUID userId) {
		User user = userRepository.findById(userId).orElseThrow(UnauthenticatedException::new);
		user.setPhoto(null);
		user.setPhotoContentType(null);
		user.setPhotoUpdatedAt(null);
		return userRepository.save(user);
	}
}
