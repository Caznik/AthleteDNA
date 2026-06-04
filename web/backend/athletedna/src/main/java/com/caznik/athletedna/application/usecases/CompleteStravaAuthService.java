package com.caznik.athletedna.application.usecases;

import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caznik.athletedna.application.port.in.CompleteStravaAuthUseCase;
import com.caznik.athletedna.application.strava.InvalidOAuthStateException;
import com.caznik.athletedna.application.strava.OAuthStateService;
import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.StravaTokens;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.domain.port.StravaClient;

@Service
@Profile("jpa")
public class CompleteStravaAuthService implements CompleteStravaAuthUseCase {

	private static final Logger log = LoggerFactory.getLogger(CompleteStravaAuthService.class);

	private final OAuthStateService oAuthStateService;
	private final StravaClient stravaClient;
	private final StravaAccountRepository stravaAccountRepository;

	public CompleteStravaAuthService(
		OAuthStateService oAuthStateService,
		StravaClient stravaClient,
		StravaAccountRepository stravaAccountRepository
	) {
		this.oAuthStateService = oAuthStateService;
		this.stravaClient = stravaClient;
		this.stravaAccountRepository = stravaAccountRepository;
	}

	@Override
	@Transactional
	public void complete(String code, String state) {
		UUID userId = oAuthStateService.consumeState(state)
			.orElseThrow(() -> new InvalidOAuthStateException("Invalid or expired OAuth state"));

		StravaTokens tokens = stravaClient.exchangeCode(code);

		Optional<StravaAccount> existing = stravaAccountRepository.findByUserId(userId);
		StravaAccount account = existing.orElseGet(() -> new StravaAccount(
			null, userId, null, null, null, null, null, null
		));
		account.setUserId(userId);
		account.setStravaAthleteId(tokens.athleteId());
		account.setAccessToken(tokens.accessToken());
		account.setRefreshToken(tokens.refreshToken());
		account.setExpiresAt(tokens.expiresAt());
		account.setScope(tokens.scope());
		stravaAccountRepository.save(account);
		log.info("Strava account linked for user={} athleteId={}", userId, tokens.athleteId());
	}
}
