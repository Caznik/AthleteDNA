package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.TrainingInsights;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.ActivityRepository;
import com.caznik.athletedna.domain.port.InsightEnginePort;
import com.caznik.athletedna.infrastructure.insight.InsightEngineException;

class GetTrainingInsightsServiceTest {

	private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

	private CurrentUserProvider currentUserProvider;
	private ActivityRepository activityRepository;
	private InsightEnginePort insightEnginePort;
	private GetTrainingInsightsService service;

	@BeforeEach
	void setUp() {
		currentUserProvider = mock(CurrentUserProvider.class);
		activityRepository = mock(ActivityRepository.class);
		insightEnginePort = mock(InsightEnginePort.class);
		service = new GetTrainingInsightsService(currentUserProvider, activityRepository, insightEnginePort);
	}

	private static TrainingInsights emptyInsights() {
		return new TrainingInsights(
			new TrainingInsights.Pmc(List.of(), new TrainingInsights.CurrentForm(0, 0, 0, "neutral")),
			List.of(),
			new TrainingInsights.Trends(0, "flat"),
			List.of());
	}

	@Test
	void forCurrentUser_loadsOnlyCallersActivitiesAndDelegatesToEngine() {
		when(currentUserProvider.current()).thenReturn(new User(USER_ID, "dev@athletedna.local"));
		List<Activity> activities = List.of(
			new Activity(UUID.randomUUID(), "Run", 10000.0, 3600L, 150, 1L, Instant.parse("2026-06-01T07:00:00Z")));
		when(activityRepository.findByUserId(USER_ID)).thenReturn(activities);
		TrainingInsights expected = emptyInsights();
		when(insightEnginePort.compute(activities)).thenReturn(expected);

		TrainingInsights result = service.forCurrentUser();

		assertThat(result).isSameAs(expected);
		verify(activityRepository).findByUserId(USER_ID);
		verify(insightEnginePort).compute(activities);
	}

	@Test
	void forCurrentUser_unauthenticated_propagatesAndNeverCallsEngine() {
		when(currentUserProvider.current()).thenThrow(new UnauthenticatedException());

		assertThatThrownBy(service::forCurrentUser).isInstanceOf(UnauthenticatedException.class);

		verifyNoInteractions(activityRepository, insightEnginePort);
	}

	@Test
	void forCurrentUser_engineFailure_propagatesAsInsightEngineException() {
		when(currentUserProvider.current()).thenReturn(new User(USER_ID, "dev@athletedna.local"));
		when(activityRepository.findByUserId(USER_ID)).thenReturn(List.of());
		when(insightEnginePort.compute(any())).thenThrow(new InsightEngineException("engine down"));

		assertThatThrownBy(service::forCurrentUser).isInstanceOf(InsightEngineException.class);
	}
}
