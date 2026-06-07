package com.caznik.athletedna.infrastructure.web.controllers;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.application.port.in.GetTrainingInsightsUseCase;
import com.caznik.athletedna.domain.model.TrainingInsights;
import com.caznik.athletedna.infrastructure.insight.InsightEngineException;
import com.caznik.athletedna.infrastructure.web.exceptions.AuthExceptionHandler;
import com.caznik.athletedna.infrastructure.web.exceptions.InsightExceptionHandler;
import com.caznik.athletedna.infrastructure.web.mappers.InsightWebMapper;

// Web-slice test asserting the actual HTTP status codes on GET /api/insights/training.
// There is no @WebMvcTest precedent in this project (every controller test is a plain
// constructor-level unit test), so a focused standalone MockMvc setup wires the real
// controller together with the two @RestControllerAdvice handlers that own the status
// mapping; the use case is mocked to drive each path. This verifies what the unit tests
// cannot: that the exceptions surface as the right HTTP statuses end to end.
//   - 401: AuthExceptionHandler maps UnauthenticatedException (the real auth seam:
//     CurrentUserProvider.current() throws it when there is no session).
//   - 503: InsightExceptionHandler maps InsightEngineException (engine down/unreachable).
//   - 200: happy path returns the mapped body.
class InsightControllerHttpStatusTest {

	private GetTrainingInsightsUseCase useCase;
	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		useCase = mock(GetTrainingInsightsUseCase.class);
		// Real mapper + both real advices so the status mapping is exercised, not mocked.
		mockMvc = MockMvcBuilders
			.standaloneSetup(new InsightController(useCase, new InsightWebMapper()))
			.setControllerAdvice(new AuthExceptionHandler(), new InsightExceptionHandler())
			.build();
	}

	@Test
	void training_authenticated_returns200() throws Exception {
		when(useCase.forCurrentUser()).thenReturn(emptyInsights());

		mockMvc.perform(get("/api/insights/training"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.pmc.current.formLabel").value("neutral"));
	}

	@Test
	void training_unauthenticated_returns401() throws Exception {
		when(useCase.forCurrentUser()).thenThrow(new UnauthenticatedException());

		mockMvc.perform(get("/api/insights/training"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.error").value("unauthorized"));
	}

	@Test
	void training_engineUnavailable_returns503() throws Exception {
		when(useCase.forCurrentUser()).thenThrow(new InsightEngineException("engine down"));

		mockMvc.perform(get("/api/insights/training"))
			.andExpect(status().isServiceUnavailable())
			.andExpect(jsonPath("$.error").value("insights_unavailable"));
	}

	// Empty insights carry no LocalDate values (series/weekly/prs are empty), so the
	// standalone converter serializes them without needing a JavaTime module.
	private static TrainingInsights emptyInsights() {
		return new TrainingInsights(
			new TrainingInsights.Pmc(List.of(), new TrainingInsights.CurrentForm(0, 0, 0, "neutral")),
			List.of(),
			new TrainingInsights.Trends(0, "flat"),
			List.of());
	}
}
