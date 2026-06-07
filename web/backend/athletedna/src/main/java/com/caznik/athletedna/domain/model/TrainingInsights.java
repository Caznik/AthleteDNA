package com.caznik.athletedna.domain.model;

import java.time.LocalDate;
import java.util.List;

// Domain value tree for the computed training insights returned by the insight
// engine. Immutable records; the engine's wire format and the public web DTO are
// mapped to/from this so the domain stays decoupled from both.
public record TrainingInsights(
	Pmc pmc,
	List<WeeklyLoadPoint> weeklyLoad,
	Trends trends,
	List<PersonalRecord> prs
) {
	public record Pmc(List<SeriesPoint> series, CurrentForm current) {}

	public record SeriesPoint(LocalDate date, double load, double ctl, double atl, double tsb) {}

	public record CurrentForm(double ctl, double atl, double tsb, String formLabel) {}

	public record WeeklyLoadPoint(LocalDate weekStart, double load) {}

	public record Trends(double ctlRampPerWeek, String tsbDirection) {}

	// bestPaceSecPerKm is null when the type has no positive-distance activity.
	public record PersonalRecord(String type, double maxDistance, long maxDuration, Double bestPaceSecPerKm) {}
}
