package com.caznik.athletedna.domain.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;

public class Activity {
	private @Getter @Setter UUID id;
	// Owning user. Set authoritatively on the write path (ActivitiesSyncUseCase) from
	// the current user; left out of the constructors so existing call sites are
	// unchanged. May be null under the in-memory (!jpa) profile before a sync stamps it.
	private @Getter @Setter UUID userId;
	private @Getter @Setter String type;
	private @Getter @Setter Double distance;
	private @Getter @Setter Long durationSeconds;
	private @Getter @Setter Integer avgHeartRate;
	private @Getter @Setter Long externalStravaId;
	private @Getter @Setter Instant startDate;

	// --- FIT import fields ---------------------------------------------------
	// All added as nullable @Getter @Setter fields OUTSIDE the constructors (the same
	// technique used for userId above), so existing Strava call sites are untouched and
	// legacy rows read these as null. "strava" is inferred at the DTO boundary when
	// source is null (AC-12); FIT imports set source="fit".
	private @Getter @Setter String source;
	private @Getter @Setter String fitFileHash;
	private @Getter @Setter String sport;
	private @Getter @Setter String subSport;
	private @Getter @Setter Double totalElapsedTime;
	private @Getter @Setter Double totalTimerTime;
	private @Getter @Setter Integer totalCalories;
	private @Getter @Setter Integer maxHeartRate;
	private @Getter @Setter Integer minHeartRate;
	private @Getter @Setter Integer avgPower;
	private @Getter @Setter Integer maxPower;
	private @Getter @Setter Integer normalizedPower;
	private @Getter @Setter Long totalWork;
	private @Getter @Setter Integer avgCadence;
	private @Getter @Setter Integer maxCadence;
	private @Getter @Setter Double avgStepLength;
	private @Getter @Setter Integer totalAscent;
	private @Getter @Setter Integer totalDescent;
	private @Getter @Setter Integer avgTemperature;
	private @Getter @Setter Double avgSpeed;
	private @Getter @Setter Double maxSpeed;
	private @Getter @Setter Double avgStanceTime;
	private @Getter @Setter Double avgVerticalOscillation;
	private @Getter @Setter Double avgVerticalRatio;
	private @Getter @Setter String manufacturer;
	private @Getter @Setter String productName;

	// Laps parsed from the FIT file, ordered by messageIndex. Empty for Strava rows.
	private @Getter @Setter List<ActivityLap> laps = new ArrayList<>();

	public Activity(UUID id, String type, Double distance, Long durationSeconds, Integer avgHeartRate) {
		this(id, type, distance, durationSeconds, avgHeartRate, null, null);
	}

	public Activity(
		UUID id,
		String type,
		Double distance,
		Long durationSeconds,
		Integer avgHeartRate,
		Long externalStravaId,
		Instant startDate
	) {
		this.id = id;
		this.type = type;
		this.distance = distance;
		this.durationSeconds = durationSeconds;
		this.avgHeartRate = avgHeartRate;
		this.externalStravaId = externalStravaId;
		this.startDate = startDate;
	}
}
