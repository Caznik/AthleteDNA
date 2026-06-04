package com.caznik.athletedna.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
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

import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;

// Use the H2 datasource configured in application-test.properties rather than
// letting @DataJpaTest swap in its own embedded one, so ddl-auto=create-drop and
// the H2 dialect from that profile actually drive the schema generation.
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@ActiveProfiles("test")
class ActivityEntityPersistenceTest {

	@Autowired
	private ActivityJpaRepository repository;

	@Test
	void save_activityWithNullAvgHr_persistsAndReReadsWithNullHr() {
		ActivityEntity entity = new ActivityEntity();
		entity.setId(UUID.randomUUID());
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
		ActivityEntity e = new ActivityEntity();
		e.setId(UUID.randomUUID());
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
		Page<ActivityEntity> page0 = repository.findPage(null, NEWEST_FIRST_PAGE0);
		assertThat(page0.getTotalElements()).isEqualTo(3);
		assertThat(page0.getContent())
			.extracting(ActivityEntity::getStartDate)
			.containsExactly(
				Instant.parse("2026-05-28T08:00:00Z"),
				Instant.parse("2026-05-20T08:00:00Z"));

		// Page 1: the null-dated activity lands last.
		Page<ActivityEntity> page1 = repository.findPage(
			null, PageRequest.of(1, 2, Sort.by(Sort.Order.desc("startDate").nullsLast())));
		assertThat(page1.getContent())
			.extracting(ActivityEntity::getStartDate)
			.containsExactly((Instant) null);
	}

	@Test
	void findPage_filtersByType() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persist("Ride", Instant.parse("2026-05-21T08:00:00Z"));

		Page<ActivityEntity> rides = repository.findPage("Ride", NEWEST_FIRST_PAGE0);

		assertThat(rides.getTotalElements()).isEqualTo(1);
		assertThat(rides.getContent().get(0).getType()).isEqualTo("Ride");
	}

	@Test
	void findDistinctTypes_returnsSortedDistinctTypes() {
		persist("Run", Instant.parse("2026-05-20T08:00:00Z"));
		persist("Run", Instant.parse("2026-05-21T08:00:00Z"));
		persist("Ride", Instant.parse("2026-05-22T08:00:00Z"));

		assertThat(repository.findDistinctTypes()).containsExactly("Ride", "Run");
	}
}
