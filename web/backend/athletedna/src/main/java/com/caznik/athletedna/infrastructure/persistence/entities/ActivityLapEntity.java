package com.caznik.athletedna.infrastructure.persistence.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// One lap of an imported FIT activity. Owned by ActivityEntity via a @ManyToOne FK;
// the parent cascades persist/remove and orphan-removes superseded laps on re-enrich.
@Entity
@Table(name = "activity_laps")
@NoArgsConstructor
public class ActivityLapEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private @Getter @Setter UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "activity_id", nullable = false)
	private @Getter @Setter ActivityEntity activity;

	@Column(name = "message_index")
	private @Getter @Setter Integer messageIndex;

	@Column(name = "start_time")
	private @Getter @Setter Instant startTime;

	@Column(name = "timestamp")
	private @Getter @Setter Instant timestamp;

	@Column(name = "total_timer_time")
	private @Getter @Setter Double totalTimerTime;

	@Column(name = "total_elapsed_time")
	private @Getter @Setter Double totalElapsedTime;

	@Column(name = "total_distance")
	private @Getter @Setter Double totalDistance;

	@Column(name = "total_calories")
	private @Getter @Setter Integer totalCalories;

	@Column(name = "avg_heart_rate")
	private @Getter @Setter Integer avgHeartRate;

	@Column(name = "max_heart_rate")
	private @Getter @Setter Integer maxHeartRate;

	@Column(name = "min_heart_rate")
	private @Getter @Setter Integer minHeartRate;

	@Column(name = "avg_cadence")
	private @Getter @Setter Integer avgCadence;

	@Column(name = "max_cadence")
	private @Getter @Setter Integer maxCadence;

	@Column(name = "avg_speed")
	private @Getter @Setter Double avgSpeed;

	@Column(name = "max_speed")
	private @Getter @Setter Double maxSpeed;

	@Column(name = "avg_power")
	private @Getter @Setter Integer avgPower;

	@Column(name = "total_ascent")
	private @Getter @Setter Integer totalAscent;

	@Column(name = "total_descent")
	private @Getter @Setter Integer totalDescent;

	@Column(name = "avg_temperature")
	private @Getter @Setter Integer avgTemperature;
}
