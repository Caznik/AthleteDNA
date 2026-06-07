package com.caznik.athletedna.application.usecases;

import java.util.List;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.GetTrainingInsightsUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.TrainingInsights;
import com.caznik.athletedna.domain.port.ActivityRepository;
import com.caznik.athletedna.domain.port.InsightEnginePort;

@Service
@Profile("jpa")
public class GetTrainingInsightsService implements GetTrainingInsightsUseCase {

	private final CurrentUserProvider currentUserProvider;
	private final ActivityRepository activityRepository;
	private final InsightEnginePort insightEnginePort;

	public GetTrainingInsightsService(
		CurrentUserProvider currentUserProvider,
		ActivityRepository activityRepository,
		InsightEnginePort insightEnginePort
	) {
		this.currentUserProvider = currentUserProvider;
		this.activityRepository = activityRepository;
		this.insightEnginePort = insightEnginePort;
	}

	@Override
	@Transactional(readOnly = true)
	public TrainingInsights forCurrentUser() {
		// current() throws UnauthenticatedException (-> 401) when there is no session,
		// so an unauthenticated call never reaches the engine.
		UUID userId = currentUserProvider.current().getId();
		List<Activity> activities = activityRepository.findByUserId(userId);
		return insightEnginePort.compute(activities);
	}
}
