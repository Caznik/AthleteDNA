package com.caznik.athletedna.infrastructure.web.mappers;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.service.TrainingLoadCalculator;
import com.caznik.athletedna.infrastructure.web.dtos.ActivityDTO;

class ActivityWebMapperTest {

	private ActivityWebMapper mapper;

	@BeforeEach
	void setUp() {
		mapper = new ActivityWebMapper(new TrainingLoadCalculator());
	}

	@Test
	void toDTO_populatesTrainingLoadFromCalculator() {
		UUID id = UUID.randomUUID();
		Activity domain = new Activity(id, "Running", 10000.0, 3600L, 150, 999L, Instant.parse("2026-05-01T08:00:00Z"));

		ActivityDTO dto = mapper.toDTO(domain);

		assertThat(dto.id()).isEqualTo(id.toString());
		assertThat(dto.type()).isEqualTo("Running");
		assertThat(dto.distance()).isEqualTo(10000.0);
		assertThat(dto.duration()).isEqualTo(3600);
		assertThat(dto.avgHr()).isEqualTo(150);
		assertThat(dto.externalStravaId()).isEqualTo(999L);
		assertThat(dto.startDate()).isEqualTo(Instant.parse("2026-05-01T08:00:00Z"));
		assertThat(dto.trainingLoad()).isEqualTo(3600L * 150);
	}

	// AC-12 — a legacy row with no source written serializes as "strava" and its
	// trainingLoad stays duration x avgHr (no regression).
	@Test
	void toDTO_nullSourceCoercesToStrava() {
		Activity domain = new Activity(UUID.randomUUID(), "Running", 10000.0, 3600L, 150);

		ActivityDTO dto = mapper.toDTO(domain);

		assertThat(dto.source()).isEqualTo("strava");
		assertThat(dto.trainingLoad()).isEqualTo(3600L * 150);
	}

	// A FIT-imported row carries its explicit source through to the wire.
	@Test
	void toDTO_fitSourcePassesThrough() {
		Activity domain = new Activity(UUID.randomUUID(), "Run", 5000.0, 1800L, 160);
		domain.setSource("fit");

		ActivityDTO dto = mapper.toDTO(domain);

		assertThat(dto.source()).isEqualTo("fit");
	}

	@Test
	void toDTO_nullAvgHr_yieldsZeroTrainingLoad() {
		Activity domain = new Activity(UUID.randomUUID(), "Ride", 20000.0, 1800L, null);

		ActivityDTO dto = mapper.toDTO(domain);

		assertThat(dto.trainingLoad()).isEqualTo(0L);
	}

	@Test
	void toDomain_ignoresTrainingLoadAndPreservesOtherFields() {
		UUID id = UUID.randomUUID();
		ActivityDTO dto = new ActivityDTO(
			id.toString(), "Running", 10000.0, 3600, 150, 999L,
			Instant.parse("2026-05-01T08:00:00Z"), 540000L, "strava"
		);

		Activity domain = mapper.toDomain(dto);

		assertThat(domain.getId()).isEqualTo(id);
		assertThat(domain.getType()).isEqualTo("Running");
		assertThat(domain.getDistance()).isEqualTo(10000.0);
		assertThat(domain.getDurationSeconds()).isEqualTo(3600L);
		assertThat(domain.getAvgHeartRate()).isEqualTo(150);
		assertThat(domain.getExternalStravaId()).isEqualTo(999L);
		assertThat(domain.getStartDate()).isEqualTo(Instant.parse("2026-05-01T08:00:00Z"));
	}

	@Test
	void toDomain_nullId_keepsNullId() {
		ActivityDTO dto = new ActivityDTO(null, "Ride", 5000.0, 600, 120, null, null, null, null);

		Activity domain = mapper.toDomain(dto);

		assertThat(domain.getId()).isNull();
	}
}
