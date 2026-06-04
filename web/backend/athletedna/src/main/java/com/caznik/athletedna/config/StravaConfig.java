package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(StravaProperties.class)
public class StravaConfig {

	// Single shared RestClient. We intentionally do NOT set a baseUrl here because
	// Strava's OAuth endpoints live under https://www.strava.com/oauth while data
	// endpoints live under https://www.strava.com/api/v3. The adapter resolves the
	// correct absolute URL from StravaProperties per request.
	@Bean
	public RestClient stravaRestClient() {
		return RestClient.builder()
			.defaultHeader("Accept", "application/json")
			.build();
	}
}
