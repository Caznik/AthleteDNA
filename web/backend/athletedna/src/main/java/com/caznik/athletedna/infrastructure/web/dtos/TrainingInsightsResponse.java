package com.caznik.athletedna.infrastructure.web.dtos;

import java.time.LocalDate;
import java.util.List;

// Public API shape for GET /api/insights/training. Mirrors the domain TrainingInsights;
// kept separate so the wire contract is decoupled from the domain model.
public record TrainingInsightsResponse(
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

	public record PersonalRecord(String type, double maxDistance, long maxDuration, Double bestPaceSecPerKm) {}
}
