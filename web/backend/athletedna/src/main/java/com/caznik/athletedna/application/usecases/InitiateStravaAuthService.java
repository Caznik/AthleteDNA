package com.caznik.athletedna.application.usecases;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.InitiateStravaAuthUseCase;
import com.caznik.athletedna.application.strava.OAuthStateService;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.StravaClient;

@Service
@Profile("jpa")
public class InitiateStravaAuthService implements InitiateStravaAuthUseCase {

	private final CurrentUserProvider currentUserProvider;
	private final OAuthStateService oAuthStateService;
	private final StravaClient stravaClient;

	public InitiateStravaAuthService(
		CurrentUserProvider currentUserProvider,
		OAuthStateService oAuthStateService,
		StravaClient stravaClient
	) {
		this.currentUserProvider = currentUserProvider;
		this.oAuthStateService = oAuthStateService;
		this.stravaClient = stravaClient;
	}

	@Override
	public String initiateForCurrentUser() {
		User user = currentUserProvider.current();
		String state = oAuthStateService.issueState(user.getId());
		return stravaClient.buildAuthorizationUrl(state);
	}
}
