package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.port.ActivityRepository;

class ActivitiesSyncUseCaseTest {

	private ActivityRepository repository;
	private ActivitiesSyncUseCase useCase;

	@BeforeEach
	void setUp() {
		repository = mock(ActivityRepository.class);
		useCase = new ActivitiesSyncUseCase(repository);
	}

	@Test
	void sync_savesActivity() {
		Activity activity = new Activity(UUID.randomUUID(), "Running", 10.0, 3600L, 150);

		int saved = useCase.sync(List.of(activity));

		verify(repository).save(activity);
		assertThat(saved).isEqualTo(1);
	}

	@Test
	void sync_savesActivityWithNullHeartRate() {
		Activity activity = new Activity(UUID.randomUUID(), "Ride", 20.0, 5400L, null);

		int saved = useCase.sync(List.of(activity));

		verify(repository).save(activity);
		assertThat(saved).isEqualTo(1);
	}

	@Test
	void sync_assignsUUIDWhenActivityHasNoId() {
		Activity activity = new Activity(null, "Running", 5.0, 1800L, 140);

		useCase.sync(List.of(activity));

		assertThat(activity.getId()).isNotNull();
	}

	@Test
	void sync_preservesExistingIdWhenActivityAlreadyHasOne() {
		UUID existingId = UUID.randomUUID();
		Activity activity = new Activity(existingId, "Cycling", 20.0, 5400L, 130);

		useCase.sync(List.of(activity));

		assertThat(activity.getId()).isEqualTo(existingId);
	}

	@Test
	void sync_savesAllActivitiesInList() {
		Activity a = new Activity(UUID.randomUUID(), "Running", 10.0, 3600L, 150);
		Activity b = new Activity(null, "Rest", 0.0, 0L, 0);

		int saved = useCase.sync(List.of(a, b));

		verify(repository).save(a);
		verify(repository).save(b);
		assertThat(saved).isEqualTo(2);
	}
}
