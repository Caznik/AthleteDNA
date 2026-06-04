package com.caznik.athletedna.application.usecases;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.IsStravaLinkedUseCase;
import com.caznik.athletedna.domain.port.StravaAccountRepository;

@Service
@Profile("jpa")
public class IsStravaLinkedService implements IsStravaLinkedUseCase {

	private final CurrentUserProvider currentUserProvider;
	private final StravaAccountRepository stravaAccountRepository;

	public IsStravaLinkedService(
		CurrentUserProvider currentUserProvider,
		StravaAccountRepository stravaAccountRepository
	) {
		this.currentUserProvider = currentUserProvider;
		this.stravaAccountRepository = stravaAccountRepository;
	}

	@Override
	public boolean isLinkedForCurrentUser() {
		UUID userId = currentUserProvider.current().getId();
		return stravaAccountRepository.findByUserId(userId).isPresent();
	}
}
