package com.caznik.athletedna.domain.port;

import java.util.List;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.TrainingInsights;

// Driven port to the external insight engine. Speaks domain types only; the HTTP/JSON
// concern lives in the infrastructure adapter (mirrors the StravaClient seam).
public interface InsightEnginePort {
	TrainingInsights compute(List<Activity> activities);
}
