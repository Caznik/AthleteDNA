package com.caznik.athletedna.domain.model;

import java.time.Instant;

public record StravaTokens(
	Long athleteId,
	String accessToken,
	String refreshToken,
	Instant expiresAt,
	String scope
) {}
