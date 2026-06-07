package com.caznik.athletedna.infrastructure.insight.dto;

import java.time.LocalDate;
import java.util.List;

// Wire payload returned by the engine (camelCase JSON). `date`/`weekStart` arrive as
// ISO local dates ("2026-06-01"); the adapter maps this to the domain TrainingInsights.
public record InsightEngineResponse(
	Pmc pmc,
	List<WeeklyLoadPoint> weeklyLoad,
	Trends trends,
	List<Pr> prs
) {
	public record Pmc(List<SeriesPoint> series, Current current) {}

	public record SeriesPoint(LocalDate date, double load, double ctl, double atl, double tsb) {}

	public record Current(double ctl, double atl, double tsb, String formLabel) {}

	public record WeeklyLoadPoint(LocalDate weekStart, double load) {}

	public record Trends(double ctlRampPerWeek, String tsbDirection) {}

	public record Pr(String type, double maxDistance, long maxDuration, Double bestPaceSecPerKm) {}
}
