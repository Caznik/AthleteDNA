package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
	String frontendUrl
) {}
