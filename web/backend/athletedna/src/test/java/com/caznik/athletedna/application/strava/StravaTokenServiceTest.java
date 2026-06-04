package com.caznik.athletedna.application.strava;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.StravaTokens;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.domain.port.StravaClient;

class StravaTokenServiceTest {

	private static final Instant NOW = Instant.parse("2026-06-01T12:00:00Z");

	private StravaClient stravaClient;
	private StravaAccountRepository accountRepository;
	private StravaTokenService service;

	@BeforeEach
	void setUp() {
		stravaClient = mock(StravaClient.class);
		accountRepository = mock(StravaAccountRepository.class);
		service = new StravaTokenService(stravaClient, accountRepository, Clock.fixed(NOW, ZoneId.of("UTC")));
	}

	@Test
	void accessTokenFor_notExpired_returnsExistingTokenWithoutRefresh() {
		StravaAccount account = account("current-access", NOW.plus(Duration.ofHours(1)));

		String token = service.accessTokenFor(account);

		assertThat(token).isEqualTo("current-access");
		verify(stravaClient, never()).refreshToken(any());
		verify(accountRepository, never()).save(any());
	}

	@Test
	void accessTokenFor_expired_callsRefreshAndPersists() {
		StravaAccount account = account("old-access", NOW.minus(Duration.ofMinutes(1)));
		when(stravaClient.refreshToken("refresh-token")).thenReturn(new StravaTokens(
			12345L, "new-access", "new-refresh",
			NOW.plus(Duration.ofHours(6)), "activity:read_all"
		));

		String token = service.accessTokenFor(account);

		assertThat(token).isEqualTo("new-access");
		assertThat(account.getRefreshToken()).isEqualTo("new-refresh");
		assertThat(account.getExpiresAt()).isEqualTo(NOW.plus(Duration.ofHours(6)));
		verify(accountRepository).save(account);
	}

	@Test
	void accessTokenFor_withinSkewWindow_refreshes() {
		// expiresAt only 30s from now — inside the 60s skew window, should refresh.
		StravaAccount account = account("old-access", NOW.plus(Duration.ofSeconds(30)));
		when(stravaClient.refreshToken("refresh-token")).thenReturn(new StravaTokens(
			12345L, "new-access", "new-refresh",
			NOW.plus(Duration.ofHours(6)), "activity:read_all"
		));

		String token = service.accessTokenFor(account);

		assertThat(token).isEqualTo("new-access");
		verify(stravaClient).refreshToken("refresh-token");
	}

	private StravaAccount account(String accessToken, Instant expiresAt) {
		return new StravaAccount(
			UUID.randomUUID(), UUID.randomUUID(), 12345L,
			accessToken, "refresh-token", expiresAt, "activity:read_all", null
		);
	}
}
