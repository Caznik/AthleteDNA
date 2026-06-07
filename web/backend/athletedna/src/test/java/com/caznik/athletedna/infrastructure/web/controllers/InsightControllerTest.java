package com.caznik.athletedna.infrastructure.web.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.port.in.GetTrainingInsightsUseCase;
import com.caznik.athletedna.domain.model.TrainingInsights;
import com.caznik.athletedna.infrastructure.web.dtos.TrainingInsightsResponse;
import com.caznik.athletedna.infrastructure.web.mappers.InsightWebMapper;

class InsightControllerTest {

	private GetTrainingInsightsUseCase useCase;
	private InsightController controller;

	@BeforeEach
	void setUp() {
		useCase = mock(GetTrainingInsightsUseCase.class);
		// Real mapper so the domain -> DTO mapping is exercised end to end.
		controller = new InsightController(useCase, new InsightWebMapper());
	}

	@Test
	void training_mapsDomainInsightsToResponse() {
		TrainingInsights domain = new TrainingInsights(
			new TrainingInsights.Pmc(
				List.of(new TrainingInsights.SeriesPoint(LocalDate.parse("2026-06-01"), 100.0, 2.3, 14.2, 0.0)),
				new TrainingInsights.CurrentForm(6.97, 37.02, -21.8, "fatigued")),
			List.of(new TrainingInsights.WeeklyLoadPoint(LocalDate.parse("2026-06-01"), 300.0)),
			new TrainingInsights.Trends(3.2, "rising"),
			List.of(new TrainingInsights.PersonalRecord("Run", 21097.0, 7200L, 300.0)));
		when(useCase.forCurrentUser()).thenReturn(domain);

		TrainingInsightsResponse resp = controller.training();

		assertThat(resp.pmc().series()).hasSize(1);
		assertThat(resp.pmc().series().get(0).date()).isEqualTo(LocalDate.parse("2026-06-01"));
		assertThat(resp.pmc().series().get(0).load()).isEqualTo(100.0);
		assertThat(resp.pmc().current().formLabel()).isEqualTo("fatigued");
		assertThat(resp.weeklyLoad().get(0).load()).isEqualTo(300.0);
		assertThat(resp.trends().ctlRampPerWeek()).isEqualTo(3.2);
		assertThat(resp.trends().tsbDirection()).isEqualTo("rising");
		assertThat(resp.prs().get(0).type()).isEqualTo("Run");
		assertThat(resp.prs().get(0).bestPaceSecPerKm()).isEqualTo(300.0);
		verify(useCase).forCurrentUser();
	}
}
