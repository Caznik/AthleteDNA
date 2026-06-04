package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.caznik.athletedna.application.strava.InvalidOAuthStateException;
import com.caznik.athletedna.application.strava.OAuthStateService;
import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.StravaTokens;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.domain.port.StravaClient;

class CompleteStravaAuthServiceTest {

	private OAuthStateService stateService;
	private StravaClient stravaClient;
	private StravaAccountRepository accountRepository;
	private CompleteStravaAuthService service;

	@BeforeEach
	void setUp() {
		stateService = mock(OAuthStateService.class);
		stravaClient = mock(StravaClient.class);
		accountRepository = mock(StravaAccountRepository.class);
		service = new CompleteStravaAuthService(stateService, stravaClient, accountRepository);
	}

	@Test
	void complete_validState_exchangesCodeAndPersistsAccount() {
		UUID userId = UUID.randomUUID();
		when(stateService.consumeState("valid-state")).thenReturn(Optional.of(userId));
		StravaTokens tokens = new StravaTokens(
			12345L, "access-abc", "refresh-xyz",
			Instant.parse("2026-06-02T00:00:00Z"), "activity:read_all"
		);
		when(stravaClient.exchangeCode("auth-code")).thenReturn(tokens);
		when(accountRepository.findByUserId(userId)).thenReturn(Optional.empty());

		service.complete("auth-code", "valid-state");

		ArgumentCaptor<StravaAccount> captor = ArgumentCaptor.forClass(StravaAccount.class);
		verify(accountRepository).save(captor.capture());
		StravaAccount saved = captor.getValue();
		assertThat(saved.getUserId()).isEqualTo(userId);
		assertThat(saved.getStravaAthleteId()).isEqualTo(12345L);
		assertThat(saved.getAccessToken()).isEqualTo("access-abc");
		assertThat(saved.getRefreshToken()).isEqualTo("refresh-xyz");
		assertThat(saved.getExpiresAt()).isEqualTo(Instant.parse("2026-06-02T00:00:00Z"));
		assertThat(saved.getScope()).isEqualTo("activity:read_all");
	}

	@Test
	void complete_invalidState_throwsAndNeverPersists() {
		when(stateService.consumeState("bad-state")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.complete("auth-code", "bad-state"))
			.isInstanceOf(InvalidOAuthStateException.class);

		verify(stravaClient, never()).exchangeCode(any());
		verify(accountRepository, never()).save(any());
	}

	@Test
	void complete_existingAccount_updatesInPlace() {
		UUID userId = UUID.randomUUID();
		UUID existingId = UUID.randomUUID();
		when(stateService.consumeState("valid-state")).thenReturn(Optional.of(userId));
		StravaAccount existing = new StravaAccount(
			existingId, userId, 999L, "old-access", "old-refresh",
			Instant.parse("2026-01-01T00:00:00Z"), "activity:read_all", Instant.parse("2026-01-01T00:00:00Z")
		);
		when(accountRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
		when(stravaClient.exchangeCode("auth-code")).thenReturn(new StravaTokens(
			999L, "new-access", "new-refresh",
			Instant.parse("2026-06-02T00:00:00Z"), "activity:read_all"
		));

		service.complete("auth-code", "valid-state");

		ArgumentCaptor<StravaAccount> captor = ArgumentCaptor.forClass(StravaAccount.class);
		verify(accountRepository).save(captor.capture());
		StravaAccount saved = captor.getValue();
		assertThat(saved.getId()).isEqualTo(existingId);
		assertThat(saved.getAccessToken()).isEqualTo("new-access");
		assertThat(saved.getRefreshToken()).isEqualTo("new-refresh");
	}
}
