package com.caznik.athletedna.infrastructure.web.controllers;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.caznik.athletedna.application.port.in.GetTrainingInsightsUseCase;
import com.caznik.athletedna.endpoints.Endpoints;
import com.caznik.athletedna.infrastructure.web.dtos.TrainingInsightsResponse;
import com.caznik.athletedna.infrastructure.web.mappers.InsightWebMapper;

@RestController
@Profile("jpa")
public class InsightController {

	private final GetTrainingInsightsUseCase getTrainingInsightsUseCase;
	private final InsightWebMapper insightWebMapper;

	public InsightController(
		GetTrainingInsightsUseCase getTrainingInsightsUseCase,
		InsightWebMapper insightWebMapper
	) {
		this.getTrainingInsightsUseCase = getTrainingInsightsUseCase;
		this.insightWebMapper = insightWebMapper;
	}

	// Authenticated: returns the caller's training insights. Unauthenticated calls 401
	// (CurrentUserProvider), and an engine failure 503 (InsightExceptionHandler).
	@GetMapping(Endpoints.INSIGHTS_ENDPOINT + "/training")
	public TrainingInsightsResponse training() {
		return insightWebMapper.toResponse(getTrainingInsightsUseCase.forCurrentUser());
	}
}
