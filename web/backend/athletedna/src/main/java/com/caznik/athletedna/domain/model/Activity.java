package com.caznik.athletedna.domain.model;

import java.time.Instant;
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
