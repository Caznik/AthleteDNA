package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "strava")
public record StravaProperties(
	String clientId,
	String clientSecret,
	String redirectUri,
	String authBaseUrl,
	String apiBaseUrl
) {}
