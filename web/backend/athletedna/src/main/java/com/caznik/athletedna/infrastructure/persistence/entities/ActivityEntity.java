package com.caznik.athletedna.infrastructure.persistence.entities;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "activities")
@NoArgsConstructor
public class ActivityEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private @Getter @Setter UUID id;

	// Owning user. Column is nullable here so ddl-auto=update can add it to existing
	// rows; the NOT NULL + FK to users(id) are applied by the hand-written migration
	// 2026-06-07_activity_user_id.sql after the backfill (ddl-auto can't do that safely).
	@Column(name = "user_id")
	private @Getter @Setter UUID userId;

	@Column(nullable = false, length = 100)
	private @Getter @Setter String type;

	@Column(nullable = false)
	private @Getter @Setter Double distance;

	@Column(nullable = false)
	private @Getter @Setter Long durationSeconds;

	@Column
	private @Getter @Setter Integer avgHr;

	@Column(name = "external_strava_id", unique = true)
	private @Getter @Setter Long externalStravaId;

	@Column(name = "start_date")
	private @Getter @Setter Instant startDate;

	// --- FIT import summary columns ------------------------------------------
	// All nullable so ddl-auto=update adds them to existing rows; legacy Strava rows
	// keep them null. fit_file_hash is the SHA-256 dedup identity (AC-5): unique, but
	// Postgres treats NULLs as distinct so Strava rows (null hash) never collide. The
	// unique index is also created explicitly by the hand-written migration.
	@Column(name = "source")
	private @Getter @Setter String source;

	@Column(name = "fit_file_hash", unique = true)
	private @Getter @Setter String fitFileHash;

	@Column(name = "sport")
	private @Getter @Setter String sport;

	@Column(name = "sub_sport")
	private @Getter @Setter String subSport;

	@Column(name = "total_elapsed_time")
	private @Getter @Setter Double totalElapsedTime;

	@Column(name = "total_timer_time")
	private @Getter @Setter Double totalTimerTime;

	@Column(name = "total_calories")
	private @Getter @Setter Integer totalCalories;

	@Column(name = "max_heart_rate")
	private @Getter @Setter Integer maxHeartRate;

	@Column(name = "min_heart_rate")
	private @Getter @Setter Integer minHeartRate;

	@Column(name = "avg_power")
	private @Getter @Setter Integer avgPower;

	@Column(name = "max_power")
	private @Getter @Setter Integer maxPower;

	@Column(name = "normalized_power")
	private @Getter @Setter Integer normalizedPower;

	@Column(name = "total_work")
	private @Getter @Setter Long totalWork;

	@Column(name = "avg_cadence")
	private @Getter @Setter Integer avgCadence;

	@Column(name = "max_cadence")
	private @Getter @Setter Integer maxCadence;

	@Column(name = "avg_step_length")
	private @Getter @Setter Double avgStepLength;

	@Column(name = "total_ascent")
	private @Getter @Setter Integer totalAscent;

	@Column(name = "total_descent")
	private @Getter @Setter Integer totalDescent;

	@Column(name = "avg_temperature")
	private @Getter @Setter Integer avgTemperature;

	@Column(name = "avg_speed")
	private @Getter @Setter Double avgSpeed;

	@Column(name = "max_speed")
	private @Getter @Setter Double maxSpeed;

	@Column(name = "avg_stance_time")
	private @Getter @Setter Double avgStanceTime;

	@Column(name = "avg_vertical_oscillation")
	private @Getter @Setter Double avgVerticalOscillation;

	@Column(name = "avg_vertical_ratio")
	private @Getter @Setter Double avgVerticalRatio;

	@Column(name = "manufacturer")
	private @Getter @Setter String manufacturer;

	@Column(name = "product_name")
	private @Getter @Setter String productName;

	// Laps cascade with the activity; orphanRemoval deletes superseded laps when the
	// collection is replaced on re-enrich. Read back ordered by message_index (AC-3).
	@OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("messageIndex ASC")
	private @Getter @Setter List<ActivityLapEntity> laps = new ArrayList<>();
}
