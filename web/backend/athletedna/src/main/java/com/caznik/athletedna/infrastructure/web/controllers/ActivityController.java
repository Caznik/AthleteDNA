package com.caznik.athletedna.infrastructure.web.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.caznik.athletedna.application.port.in.SearchActivitiesUseCase;
import com.caznik.athletedna.application.port.in.SyncActivitiesUseCase;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.endpoints.Endpoints;
import com.caznik.athletedna.infrastructure.web.mappers.ActivityWebMapper;
import com.caznik.athletedna.infrastructure.web.dtos.ActivityDTO;
import com.caznik.athletedna.infrastructure.web.dtos.ActivityPageDTO;

@RestController
public class ActivityController {

	private final SyncActivitiesUseCase syncActivitiesUseCase;
	private final SearchActivitiesUseCase searchActivitiesUseCase;
	private final ActivityWebMapper activityWebMapper;

	public ActivityController(
		SyncActivitiesUseCase syncActivitiesUseCase,
		SearchActivitiesUseCase searchActivitiesUseCase,
		ActivityWebMapper activityWebMapper
	) {
		this.syncActivitiesUseCase = syncActivitiesUseCase;
		this.searchActivitiesUseCase = searchActivitiesUseCase;
		this.activityWebMapper = activityWebMapper;
	}

	@PostMapping(Endpoints.ACTIVITIES_ENDPOINT + "/sync")
	public void sync(@RequestBody List<ActivityDTO> activities) {
		syncActivitiesUseCase.sync(
			activities.stream()
				.map(activityWebMapper::toDomain)
				.toList()
		);
	}

	@GetMapping(Endpoints.ACTIVITIES_ENDPOINT + "/getAll")
	public List<ActivityDTO> getAll() {
		return searchActivitiesUseCase.searchAll().stream()
				.map(activityWebMapper::toDTO)
				.toList();
	}

	// Paged, newest-first list for the Activities table. `type` is optional; blank
	// or absent means all types. Page/size are clamped so a bad request can't ask
	// for a negative page or an unbounded page size.
	@GetMapping(Endpoints.ACTIVITIES_ENDPOINT)
	public ActivityPageDTO list(
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "25") int size,
		@RequestParam(required = false) String type
	) {
		int safePage = Math.max(0, page);
		int safeSize = Math.min(Math.max(1, size), 100);
		String typeFilter = (type == null || type.isBlank()) ? null : type;

		ActivityPage result = searchActivitiesUseCase.searchPage(safePage, safeSize, typeFilter);
		List<ActivityDTO> items = result.items().stream()
				.map(activityWebMapper::toDTO)
				.toList();
		int totalPages = (int) Math.ceil((double) result.totalElements() / safeSize);
		return new ActivityPageDTO(items, result.totalElements(), safePage, safeSize, totalPages);
	}

	@GetMapping(Endpoints.ACTIVITIES_ENDPOINT + "/types")
	public List<String> types() {
		return searchActivitiesUseCase.listTypes();
	}
}
