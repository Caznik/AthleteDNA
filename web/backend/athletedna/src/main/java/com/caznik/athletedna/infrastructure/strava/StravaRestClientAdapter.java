package com.caznik.athletedna.infrastructure.strava;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.caznik.athletedna.config.StravaProperties;
import com.caznik.athletedna.domain.model.StravaActivitySummary;
import com.caznik.athletedna.domain.model.StravaTokens;
import com.caznik.athletedna.domain.port.StravaClient;
import com.caznik.athletedna.infrastructure.strava.dto.StravaActivityResponse;
import com.caznik.athletedna.infrastructure.strava.dto.StravaTokenResponse;

@Component
public class StravaRestClientAdapter implements StravaClient {

	private static final String SCOPE = "activity:read_all";

	private static final Logger log = LoggerFactory.getLogger(StravaRestClientAdapter.class);

	private final RestClient restClient;
	private final StravaProperties properties;

	public StravaRestClientAdapter(RestClient stravaRestClient, StravaProperties properties) {
		this.restClient = stravaRestClient;
		this.properties = properties;
	}

	@Override
	public String buildAuthorizationUrl(String state) {
		return properties.authBaseUrl() + "/authorize"
			+ "?client_id=" + encode(properties.clientId())
			+ "&redirect_uri=" + encode(properties.redirectUri())
			+ "&response_type=code"
			+ "&scope=" + encode(SCOPE)
			+ "&approval_prompt=auto"
			+ "&state=" + encode(state);
	}

	@Override
	public StravaTokens exchangeCode(String code) {
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("client_id", properties.clientId());
		form.add("client_secret", properties.clientSecret());
		form.add("code", code);
		form.add("grant_type", "authorization_code");
		log.debug("Exchanging Strava authorization code for tokens");
		StravaTokenResponse response = postTokenRequest(form);
		Long athleteId = response.athlete() != null ? response.athlete().id() : null;
		return toTokens(response, athleteId);
	}

	@Override
	public StravaTokens refreshToken(String refreshToken) {
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("client_id", properties.clientId());
		form.add("client_secret", properties.clientSecret());
		form.add("refresh_token", refreshToken);
		form.add("grant_type", "refresh_token");
		log.debug("Refreshing Strava access token");
		StravaTokenResponse response = postTokenRequest(form);
		// athleteId not returned on refresh — caller preserves the existing value.
		return toTokens(response, response.athlete() != null ? response.athlete().id() : null);
	}

	@Override
	public List<StravaActivitySummary> fetchActivities(String accessToken, Instant after, int page, int perPage) {
		String url = properties.apiBaseUrl() + "/athlete/activities"
			+ "?after=" + after.getEpochSecond()
			+ "&page=" + page
			+ "&per_page=" + perPage;
		log.debug("Fetching Strava activities page={} perPage={} after={}", page, perPage, after);
		try {
			StravaActivityResponse[] body = restClient.get()
				.uri(url)
				.header("Authorization", "Bearer " + accessToken)
				.retrieve()
				.body(StravaActivityResponse[].class);
			if (body == null) {
				return List.of();
			}
			List<StravaActivitySummary> summaries = List.of(body).stream().map(this::toSummary).toList();
			log.debug("Strava returned {} activities for page={}", summaries.size(), page);
			return summaries;
		} catch (RestClientException e) {
			throw new StravaApiException("Failed to fetch Strava activities (page=" + page + ")", e);
		}
	}

	private StravaTokenResponse postTokenRequest(MultiValueMap<String, String> form) {
		try {
			StravaTokenResponse response = restClient.post()
				.uri(properties.authBaseUrl() + "/token")
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(form)
				.retrieve()
				.body(StravaTokenResponse.class);
			if (response == null) {
				throw new StravaApiException("Strava token endpoint returned empty body");
			}
			return response;
		} catch (RestClientException e) {
			throw new StravaApiException("Failed to call Strava token endpoint", e);
		}
	}

	private StravaTokens toTokens(StravaTokenResponse response, Long athleteId) {
		Instant expiresAt = response.expiresAt() != null
			? Instant.ofEpochSecond(response.expiresAt())
			: Instant.now().plusSeconds(response.expiresIn() != null ? response.expiresIn() : 0);
		return new StravaTokens(
			athleteId,
			response.accessToken(),
			response.refreshToken(),
			expiresAt,
			response.scope()
		);
	}

	private StravaActivitySummary toSummary(StravaActivityResponse dto) {
		Integer avgHr = dto.averageHeartrate() != null ? (int) Math.round(dto.averageHeartrate()) : null;
		Instant start = dto.startDate() != null ? OffsetDateTime.parse(dto.startDate()).toInstant() : null;
		return new StravaActivitySummary(
			dto.id() != null ? dto.id() : 0L,
			dto.type() != null ? dto.type() : "",
			dto.distance() != null ? dto.distance() : 0.0,
			dto.movingTime() != null ? dto.movingTime() : 0L,
			avgHr,
			start
		);
	}

	private static String encode(String s) {
		return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
	}
}
