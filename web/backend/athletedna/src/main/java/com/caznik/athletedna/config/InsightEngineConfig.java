package com.caznik.athletedna.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestClient;

// Wiring for the insight-engine client. Only active under the jpa profile, like the
// rest of the real outbound integrations.
@Configuration
@Profile("jpa")
@EnableConfigurationProperties(InsightEngineProperties.class)
public class InsightEngineConfig {

	@Bean
	public RestClient insightEngineRestClient(InsightEngineProperties properties) {
		return RestClient.builder()
			.baseUrl(properties.baseUrl())
			.defaultHeader("Accept", "application/json")
			.build();
	}
}
