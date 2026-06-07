package com.caznik.athletedna.application.usecases;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.SyncActivitiesUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.port.ActivityRepository;

@Service
public class ActivitiesSyncUseCase implements SyncActivitiesUseCase {

	private final ActivityRepository activityRepository;
	private final CurrentUserProvider currentUserProvider;

	public ActivitiesSyncUseCase(
		ActivityRepository activityRepository,
		CurrentUserProvider currentUserProvider
	) {
		this.activityRepository = activityRepository;
		this.currentUserProvider = currentUserProvider;
	}

	@Override
	@Transactional
	public int sync(List<Activity> activities) {
		// Single chokepoint for both write paths (Strava sync + the bulk activities/sync
		// endpoint): every saved activity is owned by the current user. Stamping here
		// (rather than in each caller) keeps ownership authoritative in one place.
		UUID ownerId = currentUserProvider.current().getId();
		int saved = 0;
		for (Activity a : activities) {
			if (a.getId() == null) {
				a.setId(UUID.randomUUID());
			}
			a.setUserId(ownerId);
			activityRepository.save(a);
			saved++;
		}
		return saved;
	}
}
