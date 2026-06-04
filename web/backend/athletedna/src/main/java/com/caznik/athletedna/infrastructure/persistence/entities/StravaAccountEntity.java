package com.caznik.athletedna.infrastructure.persistence.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
	name = "strava_accounts",
	uniqueConstraints = {
		@UniqueConstraint(name = "uk_strava_accounts_user_id", columnNames = "user_id")
	}
)
@NoArgsConstructor
public class StravaAccountEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private @Getter @Setter UUID id;

	@Column(name = "user_id", nullable = false)
	private @Getter @Setter UUID userId;

	@Column(name = "strava_athlete_id", nullable = false)
	private @Getter @Setter Long stravaAthleteId;

	@Column(name = "access_token", nullable = false, length = 255)
	private @Getter @Setter String accessToken;

	@Column(name = "refresh_token", nullable = false, length = 255)
	private @Getter @Setter String refreshToken;

	@Column(name = "expires_at", nullable = false)
	private @Getter @Setter Instant expiresAt;

	@Column(nullable = false, length = 255)
	private @Getter @Setter String scope;

	@Column(name = "last_synced_at")
	private @Getter @Setter Instant lastSyncedAt;
}
