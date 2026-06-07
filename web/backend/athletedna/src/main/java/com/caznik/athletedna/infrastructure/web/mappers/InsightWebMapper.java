package com.caznik.athletedna.infrastructure.web.mappers;

import org.springframework.stereotype.Component;

import com.caznik.athletedna.domain.model.TrainingInsights;
import com.caznik.athletedna.infrastructure.web.dtos.TrainingInsightsResponse;

@Component
public class InsightWebMapper {

	public TrainingInsightsResponse toResponse(TrainingInsights i) {
		var series = i.pmc().series().stream()
			.map(s -> new TrainingInsightsResponse.SeriesPoint(
				s.date(), s.load(), s.ctl(), s.atl(), s.tsb()))
			.toList();
		var current = new TrainingInsightsResponse.CurrentForm(
			i.pmc().current().ctl(),
			i.pmc().current().atl(),
			i.pmc().current().tsb(),
			i.pmc().current().formLabel());
		var weekly = i.weeklyLoad().stream()
			.map(w -> new TrainingInsightsResponse.WeeklyLoadPoint(w.weekStart(), w.load()))
			.toList();
		var trends = new TrainingInsightsResponse.Trends(
			i.trends().ctlRampPerWeek(), i.trends().tsbDirection());
		var prs = i.prs().stream()
			.map(p -> new TrainingInsightsResponse.PersonalRecord(
				p.type(), p.maxDistance(), p.maxDuration(), p.bestPaceSecPerKm()))
			.toList();
		return new TrainingInsightsResponse(
			new TrainingInsightsResponse.Pmc(series, current), weekly, trends, prs);
	}
}
