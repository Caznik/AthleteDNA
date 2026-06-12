package com.caznik.athletedna.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityLap;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;
import com.caznik.athletedna.infrastructure.persistence.mappers.ActivityPersistenceMapper;

// Use the H2 datasource configured in application-test.properties rather than
// letting @DataJpaTest swap in its own embedded one, so ddl-auto=create-drop and
// the H2 dialect from that profile actually drive the schema generation.
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@ActiveProfiles("test")
class ActivityEntityPersistenceTest {

	@Autowired
	private ActivityJpaRepository repository;

	private static final UUID USER_A = UUID.fromString("00000000-0000-0000-0000-0000000000a1");
	private static final UUID USER_B = UUID.fromString("00000000-0000-0000-0000-0000000000b2");

	@Test
	void save_activityWithNullAvgHr_persistsAndReReadsWithNullHr() {
		ActivityEntity entity = new ActivityEntity();
		entity.setId(UUID.randomUUID());
		entity.setUserId(USER_A);
		entity.setType("Ride");
		entity.setDistance(20.0);
		entity.setDurationSeconds(5400L);
		entity.setAvgHr(null);

		ActivityEntity saved = repository.saveAndFlush(entity);
		repository.flush();

		ActivityEntity reread = repository.findById(saved.getId()).orElseThrow();
		assertThat(reread.getAvgHr()).isNull();
	}

	@Test
	void save_activityWithNonNullAvgHr_persistsAndReReadsHr() {
		ActivityEntity entity = new ActivityEntity();
		entity.setId(UUID.randomUUID());
		entity.setUserId(USER_A);
		entity.setType("Run");
		entity.setDistance(10.0);
		entity.setDurationSeconds(3600L);
		entity.setAvgHr(150);

		ActivityEntity saved = repository.saveAndFlush(entity);

		ActivityEntity reread = repository.findById(saved.getId()).orElseThrow();
		assertThat(reread.getAvgHr()).isEqualTo(150);
	}

	// Sort matching the JPA adapter: newest start date first, null dates last.
	private static final PageRequest NEWEST_FIRST_PAGE0 =
		PageRequest.of(0, 2, Sort.by(Sort.Order.desc("startDate").nullsLast()));

	private ActivityEntity persist(String type, Instant startDate) {
		return persistForUser(USER_A, type, startDate);
	}

	private ActivityEntity persistForUser(UUID userId, String type, Instant startDate) {
		ActivityEntity e = new ActivityEntity();
		e.setId(UUID.randomUUID());
		e.setUserId(userId);
		e.setType(type);
		e.setDistance(10.0);
		e.setDurationSeconds(3600L);
		e.setStartDate(startDate);
		return repository.saveAndFlush(e);
	}

	@Test
	void findPage_ordersNewestFirstWithNullDatesLast() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persist("Run", Instant.parse("2026-05-28T08:00:00Z"));
		persist("Run", null);

		// Page 0 (size 2): the two most recent dated activities, newest first.
		Page<ActivityEntity> page0 = repository.findPage(USER_A, null, NEWEST_FIRST_PAGE0);
		assertThat(page0.getTotalElements()).isEqualTo(3);
		assertThat(page0.getContent())
			.extracting(ActivityEntity::getStartDate)
			.containsExactly(
				Instant.parse("2026-05-28T08:00:00Z"),
				Instant.parse("2026-05-20T08:00:00Z"));

		// Page 1: the null-dated activity lands last.
		Page<ActivityEntity> page1 = repository.findPage(
			USER_A, null, PageRequest.of(1, 2, Sort.by(Sort.Order.desc("startDate").nullsLast())));
		assertThat(page1.getContent())
			.extracting(ActivityEntity::getStartDate)
			.containsExactly((Instant) null);
	}

	@Test
	void findPage_filtersByType() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persist("Ride", Instant.parse("2026-05-21T08:00:00Z"));

		Page<ActivityEntity> rides = repository.findPage(USER_A, "Ride", NEWEST_FIRST_PAGE0);

		assertThat(rides.getTotalElements()).isEqualTo(1);
		assertThat(rides.getContent().get(0).getType()).isEqualTo("Ride");
	}

	@Test
	void findPage_scopesToTheGivenUser() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persistForUser(USER_B, "Ride", Instant.parse("2026-05-21T08:00:00Z"));

		Page<ActivityEntity> userA = repository.findPage(USER_A, null, NEWEST_FIRST_PAGE0);

		assertThat(userA.getTotalElements()).isEqualTo(1);
		assertThat(userA.getContent().get(0).getType()).isEqualTo("Run");
	}

	@Test
	void findByUserId_returnsOnlyThatUsersActivities() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persist("Ride", Instant.parse("2026-05-21T08:00:00Z"));
		persistForUser(USER_B, "Swim", Instant.parse("2026-05-22T08:00:00Z"));

		assertThat(repository.findByUserId(USER_A))
			.extracting(ActivityEntity::getType)
			.containsExactlyInAnyOrder("Run", "Ride");
		assertThat(repository.findByUserId(USER_B))
			.extracting(ActivityEntity::getType)
			.containsExactly("Swim");
	}

	@Test
	void findDistinctTypes_returnsSortedDistinctTypesForTheUser() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persist("Run", Instant.parse("2026-05-21T08:00:00Z"));
		persist("Ride", Instant.parse("2026-05-22T08:00:00Z"));
		persistForUser(USER_B, "Swim", Instant.parse("2026-05-23T08:00:00Z"));

		assertThat(repository.findDistinctTypes(USER_A)).containsExactly("Ride", "Run");
	}

	// --- FIT import persistence ----------------------------------------------

	private static ActivityLap lap(int index, double distance, int avgHr) {
		ActivityLap l = new ActivityLap();
		l.setMessageIndex(index);
		l.setTotalDistance(distance);
		l.setAvgHeartRate(avgHr);
		return l;
	}

	private Activity fitActivity(UUID id, String hash, Instant start, int lapCount) {
		Activity a = new Activity(id, "Run", 5585.68, 1800L, 173, null, start);
		a.setUserId(USER_A);
		a.setSource("fit");
		a.setFitFileHash(hash);
		a.setSport("running");
		a.setAvgPower(223);
		a.setTotalAscent(37);
		a.setAvgTemperature(22);
		List<ActivityLap> laps = new ArrayList<>();
		for (int i = 0; i < lapCount; i++) {
			laps.add(lap(i, 1000.0 + i, 150 + i));
		}
		a.setLaps(laps);
		return a;
	}

	// AC-2 / AC-3 — round-trip an imported activity's summary + 8 laps; laps come back
	// ordered by message_index via the @OrderBy mapping.
	@Test
	void save_fitActivityWithSummaryAndLaps_roundTripsOrderedByMessageIndex() {
		UUID id = UUID.randomUUID();
		Instant start = Instant.parse("2024-12-06T09:33:47Z");
		repository.saveAndFlush(ActivityPersistenceMapper.toEntity(
			fitActivity(id, "hash-ac3", start, 8)));
		repository.flush();

		Activity reread = ActivityPersistenceMapper.toDomain(repository.findById(id).orElseThrow());

		assertThat(reread.getSource()).isEqualTo("fit");
		assertThat(reread.getSport()).isEqualTo("running");
		assertThat(reread.getDistance()).isCloseTo(5585.68, within(0.01));
		assertThat(reread.getAvgPower()).isEqualTo(223);
		assertThat(reread.getTotalAscent()).isEqualTo(37);
		assertThat(reread.getAvgTemperature()).isEqualTo(22);
		assertThat(reread.getLaps()).hasSize(8);
		assertThat(reread.getLaps())
			.extracting(ActivityLap::getMessageIndex)
			.containsExactly(0, 1, 2, 3, 4, 5, 6, 7);
		assertThat(reread.getLaps().get(0).getTotalDistance()).isCloseTo(1000.0, within(0.01));
		assertThat(reread.getLaps().get(0).getAvgHeartRate()).isEqualTo(150);
	}

	// AC-5 — fit_file_hash powers idempotent dedup lookup.
	@Test
	void findByFitFileHash_locatesTheImportedRow() {
		UUID id = UUID.randomUUID();
		repository.saveAndFlush(ActivityPersistenceMapper.toEntity(
			fitActivity(id, "hash-dedup", Instant.parse("2024-12-06T09:33:47Z"), 1)));

		assertThat(repository.findByFitFileHash("hash-dedup")).isPresent()
			.get().extracting(ActivityEntity::getId).isEqualTo(id);
		assertThat(repository.findByFitFileHash("nope")).isEmpty();
	}

	// AC-6 — the ±60s enrichment window query is user-scoped and inclusive of the bounds.
	@Test
	void findByUserIdAndStartDateBetween_returnsOnlyInWindowForUser() {
		Instant t = Instant.parse("2024-12-06T09:33:47Z");
		persistForUser(USER_A, "Run", t);
		persistForUser(USER_A, "Run", t.plusSeconds(120)); // outside ±60s
		persistForUser(USER_B, "Run", t);                  // other user

		List<ActivityEntity> hits = repository.findByUserIdAndStartDateBetween(
			USER_A, t.minusSeconds(60), t.plusSeconds(60));

		assertThat(hits).hasSize(1);
		assertThat(hits.get(0).getStartDate()).isEqualTo(t);
	}

	// orphanRemoval — re-saving the same activity id with fewer laps deletes the old laps
	// (the merge path ActivityJpaAdapter.save relies on for re-enrichment).
	@Test
	void resavingWithFewerLaps_orphanRemovesSupersededLaps() {
		UUID id = UUID.randomUUID();
		Instant start = Instant.parse("2024-12-06T09:33:47Z");
		repository.saveAndFlush(ActivityPersistenceMapper.toEntity(
			fitActivity(id, "hash-orphan", start, 8)));
		repository.flush();

		// Same id, only 2 laps now.
		repository.saveAndFlush(ActivityPersistenceMapper.toEntity(
			fitActivity(id, "hash-orphan", start, 2)));
		repository.flush();

		ActivityEntity reread = repository.findById(id).orElseThrow();
		assertThat(reread.getLaps()).hasSize(2);
	}
}
