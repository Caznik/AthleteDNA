package com.caznik.athletedna.domain.service;

import com.caznik.athletedna.domain.model.Activity;

public class TrainingLoadCalculator {

	// Normalizer matching the insight-engine's load.py (LOAD_NORMALIZER = 5400) so the
	// activities table shares the same TSS-like scale as the PMC/weekly-load charts: a
	// ~1-hour effort at ~150 bpm (3600 * 150 / 5400) lands at ~100 load points. Without
	// it the raw duration x HR product reads as huge, meaningless numbers (~400k).
	private static final double LOAD_NORMALIZER = 5400.0;

	public Double calculate(Activity activity) {
		// Treat null avgHr as 0 so Strava activities lacking HR data fall through
		// the > 0 filter in ActivitiesSyncUseCase rather than NPE-ing here.
		Long duration = activity.getDurationSeconds() != null ? activity.getDurationSeconds() : 0L;
		Integer hr = activity.getAvgHeartRate() != null ? activity.getAvgHeartRate() : 0;
		// Keep full precision; the UI rounds for display (2 decimals).
		return (duration * hr) / LOAD_NORMALIZER;
	}
}
