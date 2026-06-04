package com.caznik.athletedna.infrastructure.strava;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import com.caznik.athletedna.config.StravaProperties;
import com.caznik.athletedna.domain.model.StravaActivitySummary;
import com.caznik.athletedna.infrastructure.strava.dto.StravaActivityResponse;

class StravaRestClientAdapterTest {

	private static final StravaProperties PROPERTIES = new StravaProperties(
		"client-id", "client-secret", "http://localhost/callback",
		"https://www.strava.com/oauth", "https://www.strava.com/api/v3"
	);

	@Test
	void fetchActivities_payloadWithoutHeartRate_mapsToNullAvgHr() {
		StravaActivityResponse[] body = {
			new StravaActivityResponse(1L, "Ride", 20000.0, 5400L, null, "2026-06-01T08:00:00Z")
		};

		List<StravaActivitySummary> result = fetchWithStubbedBody(body);

		assertThat(result).hasSize(1);
		assertThat(result.get(0).averageHeartrate()).isNull();
	}

	@Test
	void fetchActivities_payloadWithHeartRate_mapsRoundedAvgHr() {
		StravaActivityResponse[] body = {
			new StravaActivityResponse(2L, "Run", 10000.0, 3600L, 149.6, "2026-06-01T08:00:00Z")
		};

		List<StravaActivitySummary> result = fetchWithStubbedBody(body);

		assertThat(result).hasSize(1);
		assertThat(result.get(0).averageHeartrate()).isEqualTo(150);
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	private List<StravaActivitySummary> fetchWithStubbedBody(StravaActivityResponse[] body) {
		RestClient restClient = mock(RestClient.class, org.mockito.Mockito.RETURNS_DEEP_STUBS);
		RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class, org.mockito.Mockito.RETURNS_DEEP_STUBS);
		when(restClient.get()).thenReturn(uriSpec);
		when(uriSpec.uri(anyString())).thenReturn(uriSpec);
		when(uriSpec.header(anyString(), any())).thenReturn(uriSpec);
		when(uriSpec.retrieve().body(StravaActivityResponse[].class)).thenReturn(body);

		StravaRestClientAdapter adapter = new StravaRestClientAdapter(restClient, PROPERTIES);
		return adapter.fetchActivities("access-token", Instant.parse("2026-05-25T00:00:00Z"), 1, 200);
	}
}
