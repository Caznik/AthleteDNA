package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.SyncActivitiesUseCase;
import com.caznik.athletedna.application.strava.StravaNotLinkedException;
import com.caznik.athletedna.application.strava.StravaTokenService;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.StravaActivitySummary;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.domain.port.StravaClient;

class SyncStravaActivitiesServiceTest {

	private static final Instant NOW = Instant.parse("2026-06-01T12:00:00Z");
	private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

	private CurrentUserProvider currentUserProvider;
	private StravaAccountRepository accountRepository;
	private StravaTokenService tokenService;
	private StravaClient stravaClient;
	private SyncActivitiesUseCase syncActivitiesUseCase;
	private SyncStravaActivitiesService service;

	@BeforeEach
	void setUp() {
		currentUserProvider = mock(CurrentUserProvider.class);
		accountRepository = mock(StravaAccountRepository.class);
		tokenService = mock(StravaTokenService.class);
		stravaClient = mock(StravaClient.class);
		syncActivitiesUseCase = mock(SyncActivitiesUseCase.class);
		Clock fixed = Clock.fixed(NOW, ZoneId.of("UTC"));
		service = new SyncStravaActivitiesService(
			currentUserProvider, accountRepository, tokenService, stravaClient,
			syncActivitiesUseCase, fixed
		);
		when(currentUserProvider.current()).thenReturn(new User(USER_ID, "dev@athletedna.local"));
		when(tokenService.accessTokenFor(any())).thenReturn("access-token");
		when(syncActivitiesUseCase.sync(any())).thenAnswer(inv -> ((List<?>) inv.getArgument(0)).size());
	}

	@Test
	void sync_noStravaAccount_throwsNotLinked() {
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.syncForCurrentUser())
			.isInstanceOf(StravaNotLinkedException.class);
	}

	@Test
	void sync_lastSyncedAtNull_usesOneYearAgo() {
		StravaAccount account = accountWithLastSyncedAt(null);
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		when(stravaClient.fetchActivities(eq("access-token"), any(), anyInt(), anyInt()))
			.thenReturn(List.of());

		service.syncForCurrentUser();

		ArgumentCaptor<Instant> after = ArgumentCaptor.forClass(Instant.class);
		verify(stravaClient).fetchActivities(eq("access-token"), after.capture(), eq(1), eq(200));
		assertThat(after.getValue()).isEqualTo(NOW.minus(Duration.ofDays(365)));
	}

	@Test
	void sync_lastSyncedAt400DaysAgo_capsAtOneYear() {
		StravaAccount account = accountWithLastSyncedAt(NOW.minus(Duration.ofDays(400)));
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		when(stravaClient.fetchActivities(any(), any(), anyInt(), anyInt())).thenReturn(List.of());

		service.syncForCurrentUser();

		ArgumentCaptor<Instant> after = ArgumentCaptor.forClass(Instant.class);
		verify(stravaClient).fetchActivities(any(), after.capture(), eq(1), eq(200));
		assertThat(after.getValue()).isEqualTo(NOW.minus(Duration.ofDays(365)));
	}

	@Test
	void sync_lastSyncedAt2DaysAgo_stillUsesFullWindow() {
		// Regression guard: a recent lastSyncedAt must NOT shrink the fetch window.
		// The cutoff is always NOW - 365d so a 2-day-old wall-clock value is ignored.
		Instant lastSynced = NOW.minus(Duration.ofDays(2));
		StravaAccount account = accountWithLastSyncedAt(lastSynced);
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		when(stravaClient.fetchActivities(any(), any(), anyInt(), anyInt())).thenReturn(List.of());

		service.syncForCurrentUser();

		ArgumentCaptor<Instant> after = ArgumentCaptor.forClass(Instant.class);
		verify(stravaClient).fetchActivities(any(), after.capture(), eq(1), eq(200));
		assertThat(after.getValue()).isEqualTo(NOW.minus(Duration.ofDays(365)));
		assertThat(after.getValue()).isNotEqualTo(lastSynced);
	}

	@Test
	void sync_lastSyncedAtRecent_stillImportsOlderBackfilledActivity() {
		// Backfill: an activity dated 30 days ago is well before a just-now lastSyncedAt,
		// yet it must still be fetched (cutoff = NOW - 365d) and passed through to sync.
		StravaAccount account = accountWithLastSyncedAt(NOW);
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		Instant backfilledStart = NOW.minus(Duration.ofDays(30));
		when(stravaClient.fetchActivities(any(), any(), eq(1), eq(200)))
			.thenReturn(List.of(new StravaActivitySummary(77L, "Run", 12.0, 4200L, 140, backfilledStart)));

		service.syncForCurrentUser();

		ArgumentCaptor<Instant> after = ArgumentCaptor.forClass(Instant.class);
		verify(stravaClient).fetchActivities(any(), after.capture(), eq(1), eq(200));
		assertThat(after.getValue()).isEqualTo(NOW.minus(Duration.ofDays(365)));
		assertThat(after.getValue()).isBefore(backfilledStart);

		ArgumentCaptor<List<Activity>> captor = ArgumentCaptor.forClass(List.class);
		verify(syncActivitiesUseCase).sync(captor.capture());
		assertThat(captor.getValue())
			.extracting(Activity::getExternalStravaId)
			.containsExactly(77L);
	}

	@Test
	void sync_paginates_untilShortPage() {
		StravaAccount account = accountWithLastSyncedAt(null);
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		List<StravaActivitySummary> fullPage = buildBatch(200);
		List<StravaActivitySummary> tail = buildBatch(50);
		when(stravaClient.fetchActivities(any(), any(), eq(1), eq(200))).thenReturn(fullPage);
		when(stravaClient.fetchActivities(any(), any(), eq(2), eq(200))).thenReturn(tail);

		int count = service.syncForCurrentUser();

		assertThat(count).isEqualTo(250);
		verify(stravaClient, times(2)).fetchActivities(anyString(), any(), anyInt(), eq(200));
	}

	@Test
	void sync_updatesLastSyncedAtToNow() {
		StravaAccount account = accountWithLastSyncedAt(NOW.minus(Duration.ofDays(3)));
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		when(stravaClient.fetchActivities(any(), any(), anyInt(), anyInt())).thenReturn(List.of());

		service.syncForCurrentUser();

		ArgumentCaptor<StravaAccount> captor = ArgumentCaptor.forClass(StravaAccount.class);
		verify(accountRepository).save(captor.capture());
		assertThat(captor.getValue().getLastSyncedAt()).isEqualTo(NOW);
	}

	@Test
	void sync_passesActivitiesToSyncUseCase() {
		StravaAccount account = accountWithLastSyncedAt(null);
		when(accountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
		List<StravaActivitySummary> batch = List.of(
			new StravaActivitySummary(1L, "Run", 10.0, 3600L, 150, NOW),
			new StravaActivitySummary(2L, "Ride", 30.0, 5400L, 130, NOW)
		);
		when(stravaClient.fetchActivities(any(), any(), eq(1), eq(200))).thenReturn(batch);

		service.syncForCurrentUser();

		ArgumentCaptor<List<Activity>> captor = ArgumentCaptor.forClass(List.class);
		verify(syncActivitiesUseCase).sync(captor.capture());
		List<Activity> passed = captor.getValue();
		assertThat(passed).hasSize(2);
		assertThat(passed.get(0).getExternalStravaId()).isEqualTo(1L);
		assertThat(passed.get(1).getExternalStravaId()).isEqualTo(2L);
	}

	private StravaAccount accountWithLastSyncedAt(Instant lastSyncedAt) {
		return new StravaAccount(
			UUID.randomUUID(), USER_ID, 12345L,
			"access", "refresh", NOW.plus(Duration.ofHours(1)),
			"activity:read_all", lastSyncedAt
		);
	}

	private List<StravaActivitySummary> buildBatch(int n) {
		List<StravaActivitySummary> list = new ArrayList<>(n);
		for (int i = 0; i < n; i++) {
			list.add(new StravaActivitySummary(i + 1, "Run", 1.0, 60L, 120, NOW));
		}
		return list;
	}
}
