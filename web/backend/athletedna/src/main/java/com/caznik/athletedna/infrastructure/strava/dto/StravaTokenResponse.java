package com.caznik.athletedna.infrastructure.strava.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// Strava returns athlete only on exchange (not refresh), so it is nullable here.
public record StravaTokenResponse(
	@JsonProperty("token_type") String tokenType,
	@JsonProperty("access_token") String accessToken,
	@JsonProperty("refresh_token") String refreshToken,
	@JsonProperty("expires_at") Long expiresAt,
	@JsonProperty("expires_in") Long expiresIn,
	@JsonProperty("scope") String scope,
	@JsonProperty("athlete") AthletePayload athlete
) {
	public record AthletePayload(@JsonProperty("id") Long id) {}
}
