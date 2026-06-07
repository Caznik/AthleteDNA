package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.ActivityRepository;

class ActivitiesSearchUseCaseTest {

	private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

	private ActivityRepository repository;
	private CurrentUserProvider currentUserProvider;
	private ActivitiesSearchUseCase useCase;

	@BeforeEach
	void setUp() {
		repository = mock(ActivityRepository.class);
		currentUserProvider = mock(CurrentUserProvider.class);
		when(currentUserProvider.current()).thenReturn(new User(USER_ID, "dev@athletedna.local"));
		useCase = new ActivitiesSearchUseCase(repository, currentUserProvider);
	}

	@Test
	void searchAll_returnsCurrentUsersActivitiesFromRepository() {
		List<Activity> expected = List.of(
			new Activity(UUID.randomUUID(), "Running", 10.0, 3600L, 150)
		);
		when(repository.findByUserId(USER_ID)).thenReturn(expected);

		List<Activity> result = useCase.searchAll();

		assertThat(result).isEqualTo(expected);
		verify(repository).findByUserId(USER_ID);
	}

	@Test
	void searchAll_returnsEmptyListWhenRepositoryIsEmpty() {
		when(repository.findByUserId(USER_ID)).thenReturn(List.of());

		List<Activity> result = useCase.searchAll();

		assertThat(result).isEmpty();
	}

	@Test
	void searchAll_scopesToCurrentUserExactlyOnce() {
		when(repository.findByUserId(USER_ID)).thenReturn(List.of());

		useCase.searchAll();

		verify(repository, times(1)).findByUserId(USER_ID);
		verifyNoMoreInteractions(repository);
	}

	@Test
	void searchPage_scopesToCurrentUserAndDelegatesArguments() {
		ActivityPage expected = new ActivityPage(
			List.of(new Activity(UUID.randomUUID(), "Running", 10.0, 3600L, 150)), 1);
		when(repository.findPage(USER_ID, 2, 25, "Running")).thenReturn(expected);

		ActivityPage result = useCase.searchPage(2, 25, "Running");

		assertThat(result).isSameAs(expected);
		verify(repository).findPage(USER_ID, 2, 25, "Running");
	}

	@Test
	void searchPage_passesNullTypeThroughForAllTypes() {
		ActivityPage expected = new ActivityPage(List.of(), 0);
		when(repository.findPage(USER_ID, 0, 25, null)).thenReturn(expected);

		ActivityPage result = useCase.searchPage(0, 25, null);

		assertThat(result).isSameAs(expected);
		verify(repository).findPage(USER_ID, 0, 25, null);
	}

	@Test
	void listTypes_returnsCurrentUsersDistinctTypesFromRepository() {
		when(repository.findDistinctTypes(USER_ID)).thenReturn(List.of("Ride", "Running"));

		List<String> result = useCase.listTypes();

		assertThat(result).containsExactly("Ride", "Running");
		verify(repository).findDistinctTypes(USER_ID);
	}
}
