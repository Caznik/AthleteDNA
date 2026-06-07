package com.caznik.athletedna.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

public class User {
	private @Getter @Setter UUID id;
	private @Getter @Setter String email;
	// Display handle chosen at registration (max 15 chars). Null for the seeded
	// stub user, which is never persisted.
	private @Getter @Setter String username;
	// BCrypt hash of the user's password. Null for the seeded stub user, which
	// has no credentials and cannot log in.
	private @Getter @Setter String passwordHash;

	// Profile photo. All three default to null (no photo) and travel through the
	// existing findById/save port methods, so the photo persists across sessions.
	private @Getter @Setter byte[] photo;
	private @Getter @Setter String photoContentType;
	private @Getter @Setter Instant photoUpdatedAt;

	// Chosen UI theme: "light" | "dark" | "system". Null when never set, which the
	// response boundary reads as "system" — so existing rows need no backfill.
	private @Getter @Setter String themePreference;

	public User(UUID id, String email) {
		this(id, email, null, null);
	}

	public User(UUID id, String email, String passwordHash) {
		this(id, email, null, passwordHash);
	}

	public User(UUID id, String email, String username, String passwordHash) {
		this.id = id;
		this.email = email;
		this.username = username;
		this.passwordHash = passwordHash;
	}
}
