package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Signing secret must be at least 32 bytes for HS256. The dev default is only
// suitable for local use; override JWT_SECRET in every real environment.
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
	String secret,
	long expirationMinutes
) {}
