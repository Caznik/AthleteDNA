package com.caznik.athletedna.config;

import java.net.http.HttpClient;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

// Wiring for the insight-engine client. Only active under the jpa profile, like the
// rest of the real outbound integrations.
@Configuration
@Profile("jpa")
@EnableConfigurationProperties(InsightEngineProperties.class)
public class InsightEngineConfig {

	@Bean
	public RestClient insightEngineRestClient(InsightEngineProperties properties) {
		// Pin HTTP/1.1: the JDK HttpClient defaults to HTTP/2 and, over plain HTTP,
		// attempts an h2c cleartext upgrade (Upgrade: h2c + HTTP2-Settings). The engine
		// runs on uvicorn/h11 (HTTP/1.1 only), which rejects the upgrade and drops the
		// chunked request body — the call then arrives with an empty body (422). Forcing
		// HTTP/1.1 removes the upgrade headers so the body is delivered intact.
		HttpClient httpClient = HttpClient.newBuilder()
			.version(HttpClient.Version.HTTP_1_1)
			.build();
		return RestClient.builder()
			.baseUrl(properties.baseUrl())
			.requestFactory(new JdkClientHttpRequestFactory(httpClient))
			.defaultHeader("Accept", "application/json")
			.build();
	}
}
