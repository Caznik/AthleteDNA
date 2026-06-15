package com.caznik.athletedna.infrastructure.web.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.port.in.SearchActivitiesUseCase;
import com.caznik.athletedna.application.port.in.SyncActivitiesUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.service.TrainingLoadCalculator;
import com.caznik.athletedna.infrastructure.web.dtos.ActivityPageDTO;
import com.caznik.athletedna.infrastructure.web.mappers.ActivityWebMapper;

class ActivityControllerTest {

	private SyncActivitiesUseCase syncUseCase;
	private SearchActivitiesUseCase searchUseCase;
	private ActivityController controller;

	@BeforeEach
	void setUp() {
		syncUseCase = mock(SyncActivitiesUseCase.class);
		searchUseCase = mock(SearchActivitiesUseCase.class);
		// Real mapper so the DTO mapping (incl. derived trainingLoad) is exercised.
		controller = new ActivityController(
			syncUseCase, searchUseCase, new ActivityWebMapper(new TrainingLoadCalculator()));
	}

	private static Activity activity(String type) {
		return new Activity(
			UUID.randomUUID(), type, 10.0, 3600L, 150, 1L, Instant.parse("2026-05-25T08:00:00Z"));
	}

	@Test
	void list_mapsPageAndComputesTotalPages() {
		when(searchUseCase.searchPage(0, 25, null))
			.thenReturn(new ActivityPage(List.of(activity("Running")), 60));

		ActivityPageDTO result = controller.list(0, 25, null);

		assertThat(result.items()).hasSize(1);
		assertThat(result.items().get(0).type()).isEqualTo("Running");
		assertThat(result.items().get(0).trainingLoad()).isEqualTo(100.0);
		assertThat(result.total()).isEqualTo(60);
		assertThat(result.page()).isZero();
		assertThat(result.size()).isEqualTo(25);
		assertThat(result.totalPages()).isEqualTo(3); // ceil(60 / 25)
	}

	@Test
	void list_passesTypeFilterThrough() {
		when(searchUseCase.searchPage(0, 25, "Ride"))
			.thenReturn(new ActivityPage(List.of(activity("Ride")), 1));

		controller.list(0, 25, "Ride");

		verify(searchUseCase).searchPage(0, 25, "Ride");
	}

	@Test
	void list_treatsBlankTypeAsAllTypes() {
		when(searchUseCase.searchPage(0, 25, null))
			.thenReturn(new ActivityPage(List.of(), 0));

		controller.list(0, 25, "   ");

		verify(searchUseCase).searchPage(0, 25, null);
	}

	@Test
	void list_clampsNegativePageAndOversizedSize() {
		when(searchUseCase.searchPage(0, 100, null))
			.thenReturn(new ActivityPage(List.of(), 0));

		controller.list(-5, 5000, null);

		// page floored to 0, size capped at 100.
		verify(searchUseCase).searchPage(0, 100, null);
	}

	@Test
	void list_clampsZeroSizeToOne() {
		when(searchUseCase.searchPage(0, 1, null))
			.thenReturn(new ActivityPage(List.of(), 0));

		controller.list(0, 0, null);

		verify(searchUseCase).searchPage(0, 1, null);
	}

	@Test
	void types_returnsUseCaseTypes() {
		when(searchUseCase.listTypes()).thenReturn(List.of("Ride", "Running"));

		assertThat(controller.types()).containsExactly("Ride", "Running");
	}
}
