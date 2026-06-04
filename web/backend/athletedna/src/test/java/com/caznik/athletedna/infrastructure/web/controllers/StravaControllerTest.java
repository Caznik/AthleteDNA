package com.caznik.athletedna.infrastructure.web.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.net.URI;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.caznik.athletedna.application.port.in.CompleteStravaAuthUseCase;
import com.caznik.athletedna.application.port.in.InitiateStravaAuthUseCase;
import com.caznik.athletedna.application.port.in.IsStravaLinkedUseCase;
import com.caznik.athletedna.application.port.in.SyncStravaActivitiesUseCase;
import com.caznik.athletedna.application.strava.InvalidOAuthStateException;
import com.caznik.athletedna.config.AppProperties;

class StravaControllerTest {

	private InitiateStravaAuthUseCase initiate;
	private CompleteStravaAuthUseCase complete;
	private SyncStravaActivitiesUseCase sync;
	private IsStravaLinkedUseCase isLinked;
	private StravaController controller;

	@BeforeEach
	void setUp() {
		initiate = mock(InitiateStravaAuthUseCase.class);
		complete = mock(CompleteStravaAuthUseCase.class);
		sync = mock(SyncStravaActivitiesUseCase.class);
		isLinked = mock(IsStravaLinkedUseCase.class);
		controller = new StravaController(
			initiate, complete, sync, isLinked,
			new AppProperties("http://localhost:3000")
		);
	}

	@Test
	void status_returnsLinkedTrue() {
		when(isLinked.isLinkedForCurrentUser()).thenReturn(true);

		assertThat(controller.status()).containsEntry("linked", true);
	}

	@Test
	void status_returnsLinkedFalse() {
		when(isLinked.isLinkedForCurrentUser()).thenReturn(false);

		assertThat(controller.status()).containsEntry("linked", false);
	}

	@Test
	void callback_success_redirectsToLinkedPage() {
		ResponseEntity<Void> response = controller.callback("auth-code", "valid-state");

		verify(complete).complete("auth-code", "valid-state");
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
		assertThat(response.getHeaders().getLocation())
			.isEqualTo(URI.create("http://localhost:3000/strava/linked"));
	}

	@Test
	void callback_invalidState_redirectsToErrorState() {
		doThrow(new InvalidOAuthStateException("bad"))
			.when(complete).complete("auth-code", "bad-state");

		ResponseEntity<Void> response = controller.callback("auth-code", "bad-state");

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
		assertThat(response.getHeaders().getLocation())
			.isEqualTo(URI.create("http://localhost:3000/strava/linked?error=invalid_state"));
	}

	@Test
	void connect_returnsAuthorizationUrl() {
		when(initiate.initiateForCurrentUser()).thenReturn("https://strava/authorize?x=1");

		Map<String, String> body = controller.connect();

		assertThat(body).containsEntry("authorizationUrl", "https://strava/authorize?x=1");
	}

	@Test
	void sync_returnsSyncedCount() {
		when(sync.syncForCurrentUser()).thenReturn(7);

		assertThat(controller.sync()).containsEntry("synced", 7);
	}
}
