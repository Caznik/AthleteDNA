package com.caznik.athletedna.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.test.context.ActiveProfiles;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityLap;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;

// Mirrors ActivityEntityPersistenceTest's setup so the H2 schema from
// application-test.properties (ddl-auto + dialect) drives the unique
// external_strava_id column the upsert relies on. The adapter is constructed
// directly because it is @Profile("jpa") and would not be component-scanned
// under the "test" profile @DataJpaTest activates.
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@ActiveProfiles("test")
class ActivityJpaAdapterTest {

	@Autowired
	private ActivityJpaRepository repository;

	private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-0000000000c3");

	@Test
	void save_sameExternalStravaIdTwice_updatesSingleRow() {
		ActivityJpaAdapter adapter = new ActivityJpaAdapter(repository);

		Activity first = activity(UUID.randomUUID(), 999L, 10.0);
		adapter.save(first);
		repository.flush();

		// Second sync of the same Strava activity, with a changed mutable field. The
		// upsert must reuse the existing row rather than insert a duplicate (would also
		// violate the unique external_strava_id constraint).
		Activity second = activity(UUID.randomUUID(), 999L, 20.0);
		adapter.save(second);
		repository.flush();

		assertThat(repository.count()).isEqualTo(1);
		ActivityEntity stored = repository.findByExternalStravaId(999L).orElseThrow();
		assertThat(stored.getDistance()).isEqualTo(20.0);
	}

	// AC-13 — FIT-first durability across a later Strava re-sync. A row already enriched
	// by a FIT file (source="fit", a preserved external_strava_id, FIT summary columns +
	// laps) must survive a subsequent Strava upsert of the same external_strava_id: the
	// Strava path carries only base fields, and must not wipe source, the FIT summary
	// columns, or the laps. Strava's own base fields may still update.
	@Test
	void save_stravaUpsertOntoFitEnrichedRow_preservesFitDataAndLaps() {
		ActivityJpaAdapter adapter = new ActivityJpaAdapter(repository);

		// A FIT enrichment outcome: source="fit", external_strava_id kept (AC-6), FIT
		// summary columns + 8 laps populated.
		UUID fitId = UUID.randomUUID();
		Activity enriched = new Activity(
			fitId, "Run", 5585.68, 1800L, 173, 999L, Instant.parse("2024-12-06T09:33:47Z"));
		enriched.setUserId(USER_ID);
		enriched.setSource("fit");
		enriched.setFitFileHash("hash-ac13");
		enriched.setSport("running");
		enriched.setAvgPower(223);
		enriched.setTotalAscent(37);
		List<ActivityLap> laps = new ArrayList<>();
		for (int i = 0; i < 8; i++) {
			ActivityLap l = new ActivityLap();
			l.setMessageIndex(i);
			l.setTotalDistance(1000.0 + i);
			l.setAvgHeartRate(150 + i);
			laps.add(l);
		}
		enriched.setLaps(laps);
		adapter.save(enriched);
		repository.flush();

		// A later Strava sync of the same activity: base fields only, no source / FIT
		// summary / hash / laps (exactly what SyncStravaActivitiesService.toActivity builds).
		Activity stravaResync = new Activity(
			UUID.randomUUID(), "Run", 6000.0, 1900L, 170, 999L, Instant.parse("2024-12-06T09:34:00Z"));
		stravaResync.setUserId(USER_ID);
		adapter.save(stravaResync);
		repository.flush();

		assertThat(repository.count()).isEqualTo(1);
		ActivityEntity stored = repository.findByExternalStravaId(999L).orElseThrow();
		// FIT-owned data survives.
		assertThat(stored.getSource()).isEqualTo("fit");
		assertThat(stored.getFitFileHash()).isEqualTo("hash-ac13");
		assertThat(stored.getAvgPower()).isEqualTo(223);
		assertThat(stored.getTotalAscent()).isEqualTo(37);
		assertThat(stored.getSport()).isEqualTo("running");
		assertThat(stored.getLaps()).hasSize(8);
		// Strava's own base fields still update.
		assertThat(stored.getDistance()).isEqualTo(6000.0);
		assertThat(stored.getDurationSeconds()).isEqualTo(1900L);
		assertThat(stored.getAvgHr()).isEqualTo(170);
		assertThat(stored.getStartDate()).isEqualTo(Instant.parse("2024-12-06T09:34:00Z"));
	}

	// A genuine FIT re-import (incoming source="fit") must still overwrite — the AC-13
	// protection only shields against the Strava path, not against FIT itself (AC-6).
	@Test
	void save_fitReimportOntoFitRow_stillOverwrites() {
		ActivityJpaAdapter adapter = new ActivityJpaAdapter(repository);

		UUID fitId = UUID.randomUUID();
		Activity first = new Activity(
			fitId, "Run", 5000.0, 1800L, 173, 999L, Instant.parse("2024-12-06T09:33:47Z"));
		first.setUserId(USER_ID);
		first.setSource("fit");
		first.setFitFileHash("hash-first");
		first.setAvgPower(223);
		adapter.save(first);
		repository.flush();

		Activity reimport = new Activity(
			UUID.randomUUID(), "Run", 5100.0, 1810L, 174, 999L, Instant.parse("2024-12-06T09:33:50Z"));
		reimport.setUserId(USER_ID);
		reimport.setSource("fit");
		reimport.setFitFileHash("hash-second");
		reimport.setAvgPower(250);
		adapter.save(reimport);
		repository.flush();

		assertThat(repository.count()).isEqualTo(1);
		ActivityEntity stored = repository.findByExternalStravaId(999L).orElseThrow();
		assertThat(stored.getSource()).isEqualTo("fit");
		assertThat(stored.getFitFileHash()).isEqualTo("hash-second");
		assertThat(stored.getAvgPower()).isEqualTo(250);
	}

	private Activity activity(UUID id, Long externalStravaId, Double distance) {
		Activity activity = new Activity(
			id, "Run", distance, 3600L, 150, externalStravaId, Instant.parse("2026-05-01T08:00:00Z"));
		activity.setUserId(USER_ID);
		return activity;
	}
}
