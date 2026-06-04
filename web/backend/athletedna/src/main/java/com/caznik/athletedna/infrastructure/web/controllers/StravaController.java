package com.caznik.athletedna.infrastructure.web.controllers;

import java.net.URI;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.caznik.athletedna.application.port.in.CompleteStravaAuthUseCase;
import com.caznik.athletedna.application.port.in.InitiateStravaAuthUseCase;
import com.caznik.athletedna.application.port.in.IsStravaLinkedUseCase;
import com.caznik.athletedna.application.port.in.SyncStravaActivitiesUseCase;
import com.caznik.athletedna.application.strava.InvalidOAuthStateException;
import com.caznik.athletedna.config.AppProperties;
import com.caznik.athletedna.endpoints.Endpoints;

@RestController
@Profile("jpa")
public class StravaController {

	private final InitiateStravaAuthUseCase initiateStravaAuthUseCase;
	private final CompleteStravaAuthUseCase completeStravaAuthUseCase;
	private final SyncStravaActivitiesUseCase syncStravaActivitiesUseCase;
	private final IsStravaLinkedUseCase isStravaLinkedUseCase;
	private final AppProperties appProperties;

	public StravaController(
		InitiateStravaAuthUseCase initiateStravaAuthUseCase,
		CompleteStravaAuthUseCase completeStravaAuthUseCase,
		SyncStravaActivitiesUseCase syncStravaActivitiesUseCase,
		IsStravaLinkedUseCase isStravaLinkedUseCase,
		AppProperties appProperties
	) {
		this.initiateStravaAuthUseCase = initiateStravaAuthUseCase;
		this.completeStravaAuthUseCase = completeStravaAuthUseCase;
		this.syncStravaActivitiesUseCase = syncStravaActivitiesUseCase;
		this.isStravaLinkedUseCase = isStravaLinkedUseCase;
		this.appProperties = appProperties;
	}

	@GetMapping(Endpoints.STRAVA_ENDPOINT + "/connect")
	public Map<String, String> connect() {
		return Map.of("authorizationUrl", initiateStravaAuthUseCase.initiateForCurrentUser());
	}

	@GetMapping(Endpoints.STRAVA_ENDPOINT + "/status")
	public Map<String, Boolean> status() {
		return Map.of("linked", isStravaLinkedUseCase.isLinkedForCurrentUser());
	}

	@GetMapping(Endpoints.STRAVA_ENDPOINT + "/callback")
	public ResponseEntity<Void> callback(
		@RequestParam("code") String code,
		@RequestParam("state") String state
	) {
		// The browser hits this via Strava's redirect, so we must 302 back to the
		// frontend rather than return JSON. InvalidOAuthStateException is caught here
		// (not delegated to StravaExceptionHandler) so the user lands on a friendly
		// error state instead of a raw 400 JSON body.
		String target;
		try {
			completeStravaAuthUseCase.complete(code, state);
			target = appProperties.frontendUrl() + "/strava/linked";
		} catch (InvalidOAuthStateException ex) {
			target = appProperties.frontendUrl() + "/strava/linked?error=invalid_state";
		}
		return ResponseEntity.status(HttpStatus.FOUND)
			.header(HttpHeaders.LOCATION, target)
			.build();
	}

	@PostMapping(Endpoints.STRAVA_ENDPOINT + "/sync")
	public Map<String, Integer> sync() {
		int synced = syncStravaActivitiesUseCase.syncForCurrentUser();
		return Map.of("synced", synced);
	}
}
