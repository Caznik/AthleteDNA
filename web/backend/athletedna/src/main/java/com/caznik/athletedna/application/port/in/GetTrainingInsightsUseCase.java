package com.caznik.athletedna.application.port.in;

import com.caznik.athletedna.domain.model.TrainingInsights;

public interface GetTrainingInsightsUseCase {
	TrainingInsights forCurrentUser();
}
