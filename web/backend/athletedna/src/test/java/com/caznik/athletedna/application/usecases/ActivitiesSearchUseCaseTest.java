package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.port.ActivityRepository;

class ActivitiesSearchUseCaseTest {

	private ActivityRepository repository;
	private ActivitiesSearchUseCase useCase;

	@BeforeEach
	void setUp() {
		repository = mock(ActivityRepository.class);
		useCase = new ActivitiesSearchUseCase(repository);
	}

	@Test
	void searchAll_returnsActivitiesFromRepository() {
		List<Activity> expected = List.of(
			new Activity(UUID.randomUUID(), "Running", 10.0, 3600L, 150)
		);
		when(repository.findAll()).thenReturn(expected);

		List<Activity> result = useCase.searchAll();

		assertThat(result).isEqualTo(expected);
	}

	@Test
	void searchAll_returnsEmptyListWhenRepositoryIsEmpty() {
		when(repository.findAll()).thenReturn(List.of());

		List<Activity> result = useCase.searchAll();

		assertThat(result).isEmpty();
	}

	@Test
	void searchAll_delegatesToRepositoryExactlyOnce() {
		when(repository.findAll()).thenReturn(List.of());

		useCase.searchAll();

		verify(repository, times(1)).findAll();
	}

	@Test
	void searchPage_delegatesArgumentsAndReturnsRepositoryPage() {
		ActivityPage expected = new ActivityPage(
			List.of(new Activity(UUID.randomUUID(), "Running", 10.0, 3600L, 150)), 1);
		when(repository.findPage(2, 25, "Running")).thenReturn(expected);

		ActivityPage result = useCase.searchPage(2, 25, "Running");

		assertThat(result).isSameAs(expected);
		verify(repository).findPage(2, 25, "Running");
	}

	@Test
	void searchPage_passesNullTypeThroughForAllTypes() {
		ActivityPage expected = new ActivityPage(List.of(), 0);
		when(repository.findPage(0, 25, null)).thenReturn(expected);

		ActivityPage result = useCase.searchPage(0, 25, null);

		assertThat(result).isSameAs(expected);
		verify(repository).findPage(0, 25, null);
	}

	@Test
	void listTypes_returnsDistinctTypesFromRepository() {
		when(repository.findDistinctTypes()).thenReturn(List.of("Ride", "Running"));

		List<String> result = useCase.listTypes();

		assertThat(result).containsExactly("Ride", "Running");
		verify(repository).findDistinctTypes();
	}
}
