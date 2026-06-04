package com.caznik.athletedna.application.strava;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.StravaTokens;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.domain.port.StravaClient;

@Service
@Profile("jpa")
public class StravaTokenService {

	private static final Duration SKEW = Duration.ofSeconds(60);

	private final StravaClient stravaClient;
	private final StravaAccountRepository stravaAccountRepository;
	private final Clock clock;

	@Autowired
	public StravaTokenService(StravaClient stravaClient, StravaAccountRepository stravaAccountRepository) {
		this(stravaClient, stravaAccountRepository, Clock.systemUTC());
	}

	// Visible for testing.
	public StravaTokenService(
		StravaClient stravaClient,
		StravaAccountRepository stravaAccountRepository,
		Clock clock
	) {
		this.stravaClient = stravaClient;
		this.stravaAccountRepository = stravaAccountRepository;
		this.clock = clock;
	}

	public String accessTokenFor(StravaAccount account) {
		Instant now = clock.instant();
		if (account.getExpiresAt() != null && account.getExpiresAt().isAfter(now.plus(SKEW))) {
			return account.getAccessToken();
		}
		StravaTokens refreshed = stravaClient.refreshToken(account.getRefreshToken());
		account.setAccessToken(refreshed.accessToken());
		account.setRefreshToken(refreshed.refreshToken());
		account.setExpiresAt(refreshed.expiresAt());
		if (refreshed.scope() != null) {
			account.setScope(refreshed.scope());
		}
		stravaAccountRepository.save(account);
		return account.getAccessToken();
	}
}
