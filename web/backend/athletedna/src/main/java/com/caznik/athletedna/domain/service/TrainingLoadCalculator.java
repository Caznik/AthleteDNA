package com.caznik.athletedna.domain.service;

import com.caznik.athletedna.domain.model.Activity;

public class TrainingLoadCalculator {

	public Long calculate(Activity activity) {
		// Treat null avgHr as 0 so Strava activities lacking HR data fall through
		// the > 0 filter in ActivitiesSyncUseCase rather than NPE-ing here.
		Long duration = activity.getDurationSeconds() != null ? activity.getDurationSeconds() : 0L;
		Integer hr = activity.getAvgHeartRate() != null ? activity.getAvgHeartRate() : 0;
		return duration * hr;
	}
}
