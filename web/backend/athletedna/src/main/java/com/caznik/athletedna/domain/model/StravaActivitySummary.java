package com.caznik.athletedna.domain.model;

import java.time.Instant;

public record StravaActivitySummary(
	long id,
	String type,
	double distance,
	long movingTimeSeconds,
	Integer averageHeartrate,
	Instant startDate
) {}
