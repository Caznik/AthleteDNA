package com.caznik.athletedna.application.usecases;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.SyncActivitiesUseCase;
import com.caznik.athletedna.application.port.in.SyncStravaActivitiesUseCase;
import com.caznik.athletedna.application.strava.StravaNotLinkedException;
import com.caznik.athletedna.application.strava.StravaTokenService;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.StravaActivitySummary;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.domain.port.StravaClient;

@Service
@Profile("jpa")
public class SyncStravaActivitiesService implements SyncStravaActivitiesUseCase {

	private static final int PAGE_SIZE = 200;
	private static final Duration SYNC_CAP = Duration.ofDays(365);

	private static final Logger log = LoggerFactory.getLogger(SyncStravaActivitiesService.class);

	private final CurrentUserProvider currentUserProvider;
	private final StravaAccountRepository stravaAccountRepository;
	private final StravaTokenService stravaTokenService;
	private final StravaClient stravaClient;
	private final SyncActivitiesUseCase syncActivitiesUseCase;
	private final Clock clock;

	@Autowired
	public SyncStravaActivitiesService(
		CurrentUserProvider currentUserProvider,
		StravaAccountRepository stravaAccountRepository,
		StravaTokenService stravaTokenService,
		StravaClient stravaClient,
		SyncActivitiesUseCase syncActivitiesUseCase
	) {
		this(currentUserProvider, stravaAccountRepository, stravaTokenService, stravaClient,
			syncActivitiesUseCase, Clock.systemUTC());
	}

	// Visible for testing.
	public SyncStravaActivitiesService(
		CurrentUserProvider currentUserProvider,
		StravaAccountRepository stravaAccountRepository,
		StravaTokenService stravaTokenService,
		StravaClient stravaClient,
		SyncActivitiesUseCase syncActivitiesUseCase,
		Clock clock
	) {
		this.currentUserProvider = currentUserProvider;
		this.stravaAccountRepository = stravaAccountRepository;
		this.stravaTokenService = stravaTokenService;
		this.stravaClient = stravaClient;
		this.syncActivitiesUseCase = syncActivitiesUseCase;
		this.clock = clock;
	}

	@Override
	public int syncForCurrentUser() {
		User user = currentUserProvider.current();
		StravaAccount account = stravaAccountRepository.findByUserId(user.getId())
			.orElseThrow(() -> new StravaNotLinkedException("Current user has no linked Strava account"));

		Instant now = clock.instant();
		Instant capStart = now.minus(SYNC_CAP);
		Instant lastSyncedAt = account.getLastSyncedAt() != null ? account.getLastSyncedAt() : Instant.EPOCH;
		// Cap to the last year when lastSyncedAt is older (or missing).
		Instant after = lastSyncedAt.isAfter(capStart) ? lastSyncedAt : capStart;

		String accessToken = stravaTokenService.accessTokenFor(account);

		log.info("Strava sync started for user={} since={}", user.getId(), after);

		List<Activity> collected = new ArrayList<>();
		int page = 1;
		while (true) {
			List<StravaActivitySummary> batch = stravaClient.fetchActivities(accessToken, after, page, PAGE_SIZE);
			for (StravaActivitySummary s : batch) {
				collected.add(toActivity(s));
			}
			if (batch.size() < PAGE_SIZE) {
				break;
			}
			page++;
		}

		int saved = syncActivitiesUseCase.sync(collected);

		account.setLastSyncedAt(now);
		stravaAccountRepository.save(account);

		log.info("Strava sync finished for user={}: fetched={} saved={}",
			user.getId(), collected.size(), saved);

		return saved;
	}

	private Activity toActivity(StravaActivitySummary summary) {
		return new Activity(
			null,
			summary.type(),
			summary.distance(),
			summary.movingTimeSeconds(),
			summary.averageHeartrate(),
			summary.id(),
			summary.startDate()
		);
	}
}
