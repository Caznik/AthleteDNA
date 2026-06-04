package com.caznik.athletedna.domain.port;

import java.time.Instant;
import java.util.List;

import com.caznik.athletedna.domain.model.StravaActivitySummary;
import com.caznik.athletedna.domain.model.StravaTokens;

public interface StravaClient {
	String buildAuthorizationUrl(String state);
	StravaTokens exchangeCode(String code);
	StravaTokens refreshToken(String refreshToken);
	List<StravaActivitySummary> fetchActivities(String accessToken, Instant after, int page, int perPage);
}
