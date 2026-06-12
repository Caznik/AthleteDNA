package com.caznik.athletedna.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.test.context.ActiveProfiles;

import com.caznik.athletedna.domain.model.Activity;
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

	private Activity activity(UUID id, Long externalStravaId, Double distance) {
		Activity activity = new Activity(
			id, "Run", distance, 3600L, 150, externalStravaId, Instant.parse("2026-05-01T08:00:00Z"));
		activity.setUserId(USER_ID);
		return activity;
	}
}
