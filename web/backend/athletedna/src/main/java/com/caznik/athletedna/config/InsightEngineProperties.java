package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Typed config for the insight-engine HTTP call. `internalToken` is the shared secret
// sent as the X-Internal-Token header; the browser never reaches the engine directly.
@ConfigurationProperties(prefix = "insight-engine")
public record InsightEngineProperties(
	String baseUrl,
	String internalToken
) {}
