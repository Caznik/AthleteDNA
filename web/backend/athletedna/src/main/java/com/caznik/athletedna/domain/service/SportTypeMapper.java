package com.caznik.athletedna.domain.service;

import java.util.Locale;
import java.util.Map;

// Maps a raw FIT sport string to the app's canonical activity type (the same
// vocabulary Strava sync produces: Run, Ride, Walk, ...). Kept framework-free in
// domain/service and registered as a @Bean in DomainConfig, mirroring
// TrainingLoadCalculator. Never returns null: an unknown/absent sport falls back to
// "Workout" so every imported activity has a usable type (AC-11).
public class SportTypeMapper {

	private static final String DEFAULT_TYPE = "Workout";

	private static final Map<String, String> CANONICAL = Map.of(
		"running", "Run",
		"cycling", "Ride",
		"walking", "Walk",
		"hiking", "Hike",
		"rowing", "Rowing",
		"training", "Workout",
		"fitness_equipment", "Workout",
		"generic", "Workout"
	);

	public String toCanonicalType(String fitSport) {
		if (fitSport == null) {
			return DEFAULT_TYPE;
		}
		// FIT sport strings are matched case-insensitively: the Garmin SDK's
		// Sport.getStringFromValue returns the upper-case enum name ("RUNNING").
		return CANONICAL.getOrDefault(fitSport.toLowerCase(Locale.ROOT), DEFAULT_TYPE);
	}
}
