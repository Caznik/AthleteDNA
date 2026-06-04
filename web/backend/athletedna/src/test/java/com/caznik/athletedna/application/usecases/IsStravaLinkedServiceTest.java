package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.StravaAccountRepository;

class IsStravaLinkedServiceTest {

	private CurrentUserProvider currentUserProvider;
	private StravaAccountRepository stravaAccountRepository;
	private IsStravaLinkedService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		currentUserProvider = mock(CurrentUserProvider.class);
		stravaAccountRepository = mock(StravaAccountRepository.class);
		service = new IsStravaLinkedService(currentUserProvider, stravaAccountRepository);
		when(currentUserProvider.current()).thenReturn(new User(userId, "dev@athletedna.local"));
	}

	@Test
	void isLinkedForCurrentUser_returnsTrueWhenAccountExists() {
		StravaAccount account = new StravaAccount(
			UUID.randomUUID(), userId, 1L, "a", "r",
			Instant.now(), "activity:read_all", Instant.now()
		);
		when(stravaAccountRepository.findByUserId(userId)).thenReturn(Optional.of(account));

		assertThat(service.isLinkedForCurrentUser()).isTrue();
	}

	@Test
	void isLinkedForCurrentUser_returnsFalseWhenNoAccount() {
		when(stravaAccountRepository.findByUserId(userId)).thenReturn(Optional.empty());

		assertThat(service.isLinkedForCurrentUser()).isFalse();
	}
}
