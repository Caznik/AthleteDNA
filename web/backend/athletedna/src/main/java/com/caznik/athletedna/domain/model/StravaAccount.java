package com.caznik.athletedna.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

public class StravaAccount {
	private @Getter @Setter UUID id;
	private @Getter @Setter UUID userId;
	private @Getter @Setter Long stravaAthleteId;
	private @Getter @Setter String accessToken;
	private @Getter @Setter String refreshToken;
	private @Getter @Setter Instant expiresAt;
	private @Getter @Setter String scope;
	private @Getter @Setter Instant lastSyncedAt;

	public StravaAccount(
		UUID id,
		UUID userId,
		Long stravaAthleteId,
		String accessToken,
		String refreshToken,
		Instant expiresAt,
		String scope,
		Instant lastSyncedAt
	) {
		this.id = id;
		this.userId = userId;
		this.stravaAthleteId = stravaAthleteId;
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.expiresAt = expiresAt;
		this.scope = scope;
		this.lastSyncedAt = lastSyncedAt;
	}
}
