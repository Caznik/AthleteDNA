package com.caznik.athletedna.domain.model;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

// One lap of a FIT activity. Persisted in the activity_laps table, ordered by
// messageIndex, FK back to its owning Activity. All summary fields are boxed and
// nullable: COROS omits whatever the sport doesn't measure (e.g. strength laps have
// no distance/power), so an absent FIT field stays null rather than defaulting.
public class ActivityLap {
	private @Getter @Setter Integer messageIndex;
	private @Getter @Setter Instant startTime;
	private @Getter @Setter Instant timestamp;
	private @Getter @Setter Double totalTimerTime;
	private @Getter @Setter Double totalElapsedTime;
	private @Getter @Setter Double totalDistance;
	private @Getter @Setter Integer totalCalories;
	private @Getter @Setter Integer avgHeartRate;
	private @Getter @Setter Integer maxHeartRate;
	private @Getter @Setter Integer minHeartRate;
	private @Getter @Setter Integer avgCadence;
	private @Getter @Setter Integer maxCadence;
	private @Getter @Setter Double avgSpeed;
	private @Getter @Setter Double maxSpeed;
	private @Getter @Setter Integer avgPower;
	private @Getter @Setter Integer totalAscent;
	private @Getter @Setter Integer totalDescent;
	private @Getter @Setter Integer avgTemperature;
}
