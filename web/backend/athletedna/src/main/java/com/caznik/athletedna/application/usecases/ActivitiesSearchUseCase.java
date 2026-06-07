package com.caznik.athletedna.application.usecases;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.SearchActivitiesUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.port.ActivityRepository;

@Service
public class ActivitiesSearchUseCase implements SearchActivitiesUseCase {

	private final ActivityRepository activityRepository;
	private final CurrentUserProvider currentUserProvider;

	public ActivitiesSearchUseCase(
		ActivityRepository activityRepository,
		CurrentUserProvider currentUserProvider
	) {
		this.activityRepository = activityRepository;
		this.currentUserProvider = currentUserProvider;
	}

	// Reads are scoped to the logged-in user. User resolution lives here in the use-case
	// layer so the controller and the SearchActivitiesUseCase port stay unchanged.
	@Transactional(readOnly = true)
	public List<Activity> searchAll() {
		return activityRepository.findByUserId(currentUserId());
	}

	@Transactional(readOnly = true)
	public ActivityPage searchPage(int page, int size, String type) {
		return activityRepository.findPage(currentUserId(), page, size, type);
	}

	@Transactional(readOnly = true)
	public List<String> listTypes() {
		return activityRepository.findDistinctTypes(currentUserId());
	}

	private UUID currentUserId() {
		return currentUserProvider.current().getId();
	}

}
