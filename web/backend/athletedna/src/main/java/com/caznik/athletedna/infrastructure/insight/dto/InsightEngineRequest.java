package com.caznik.athletedna.infrastructure.insight.dto;

import java.time.Instant;
import java.util.List;

// Wire payload sent to the engine. Field names match the engine's contract
// (startDate / avgHr); Instant serializes to an ISO-8601 instant, duration is seconds.
public record InsightEngineRequest(List<Activity> activities) {

	public record Activity(
		Instant startDate,
		String type,
		Double distance,
		Long duration,
		Integer avgHr
	) {}
}
