package com.caznik.athletedna.infrastructure.persistence.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@NoArgsConstructor
public class UserEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private @Getter @Setter UUID id;

	@Column(nullable = false, unique = true, length = 255)
	private @Getter @Setter String email;

	@Column(nullable = false, unique = true, length = 15)
	private @Getter @Setter String username;

	// Nullable: the seeded stub user predates auth and has no credentials.
	@Column(name = "password_hash", length = 255)
	private @Getter @Setter String passwordHash;

	// Profile photo bytes stored inline as a true Postgres bytea. columnDefinition
	// pins the column type explicitly: with @Lob, Hibernate would map byte[] to an
	// oid large object on Postgres instead of bytea. All three columns are nullable
	// so existing rows (and users without a photo) stay valid.
	@Column(name = "photo", columnDefinition = "bytea")
	private @Getter @Setter byte[] photo;

	@Column(name = "photo_content_type", length = 64)
	private @Getter @Setter String photoContentType;

	@Column(name = "photo_updated_at")
	private @Getter @Setter Instant photoUpdatedAt;

	// Chosen UI theme ("light"/"dark"/"system"). Nullable so existing rows stay
	// valid; created automatically by ddl-auto=update. Null is read as "system".
	@Column(name = "theme_preference", length = 16)
	private @Getter @Setter String themePreference;

	// Chosen UI language ("en"/"es"). Nullable so existing rows stay valid; created
	// automatically by ddl-auto=update. Null is read as "en".
	@Column(name = "language_preference", length = 8)
	private @Getter @Setter String languagePreference;
}
