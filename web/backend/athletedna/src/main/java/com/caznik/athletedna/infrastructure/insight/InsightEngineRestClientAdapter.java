package com.caznik.athletedna.infrastructure.insight;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.caznik.athletedna.config.InsightEngineProperties;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.TrainingInsights;
import com.caznik.athletedna.domain.port.InsightEnginePort;
import com.caznik.athletedna.infrastructure.insight.dto.InsightEngineRequest;
import com.caznik.athletedna.infrastructure.insight.dto.InsightEngineResponse;

@Component
@Profile("jpa")
public class InsightEngineRestClientAdapter implements InsightEnginePort {

	private static final String TRAINING_PATH = "/insights/training";
	private static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";

	private static final Logger log = LoggerFactory.getLogger(InsightEngineRestClientAdapter.class);

	private final RestClient restClient;
	private final InsightEngineProperties properties;

	public InsightEngineRestClientAdapter(RestClient insightEngineRestClient, InsightEngineProperties properties) {
		this.restClient = insightEngineRestClient;
		this.properties = properties;
	}

	@Override
	public TrainingInsights compute(List<Activity> activities) {
		InsightEngineRequest request = new InsightEngineRequest(
			activities.stream().map(this::toWire).toList());
		log.debug("Calling insight engine for {} activities", activities.size());
		try {
			InsightEngineResponse response = restClient.post()
				.uri(TRAINING_PATH)
				.header(INTERNAL_TOKEN_HEADER, properties.internalToken())
				.contentType(MediaType.APPLICATION_JSON)
				.body(request)
				.retrieve()
				.body(InsightEngineResponse.class);
			if (response == null) {
				throw new InsightEngineException("Insight engine returned an empty body");
			}
			return toDomain(response);
		} catch (RestClientException e) {
			throw new InsightEngineException("Failed to call the insight engine", e);
		}
	}

	private InsightEngineRequest.Activity toWire(Activity a) {
		return new InsightEngineRequest.Activity(
			a.getStartDate(),
			a.getType(),
			a.getDistance(),
			a.getDurationSeconds(),
			a.getAvgHeartRate()
		);
	}

	private TrainingInsights toDomain(InsightEngineResponse r) {
		List<TrainingInsights.SeriesPoint> series = r.pmc().series().stream()
			.map(s -> new TrainingInsights.SeriesPoint(s.date(), s.load(), s.ctl(), s.atl(), s.tsb()))
			.toList();
		InsightEngineResponse.Current c = r.pmc().current();
		TrainingInsights.CurrentForm current =
			new TrainingInsights.CurrentForm(c.ctl(), c.atl(), c.tsb(), c.formLabel());
		List<TrainingInsights.WeeklyLoadPoint> weekly = r.weeklyLoad().stream()
			.map(w -> new TrainingInsights.WeeklyLoadPoint(w.weekStart(), w.load()))
			.toList();
		TrainingInsights.Trends trends =
			new TrainingInsights.Trends(r.trends().ctlRampPerWeek(), r.trends().tsbDirection());
		List<TrainingInsights.PersonalRecord> prs = r.prs().stream()
			.map(p -> new TrainingInsights.PersonalRecord(
				p.type(), p.maxDistance(), p.maxDuration(), p.bestPaceSecPerKm()))
			.toList();
		return new TrainingInsights(new TrainingInsights.Pmc(series, current), weekly, trends, prs);
	}
}
