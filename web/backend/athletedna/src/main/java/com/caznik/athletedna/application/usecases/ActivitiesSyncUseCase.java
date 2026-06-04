package com.caznik.athletedna.application.usecases;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caznik.athletedna.application.port.in.SyncActivitiesUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.port.ActivityRepository;

@Service
public class ActivitiesSyncUseCase implements SyncActivitiesUseCase {

	private final ActivityRepository activityRepository;

	public ActivitiesSyncUseCase(ActivityRepository activityRepository) {
		this.activityRepository = activityRepository;
	}

	@Override
	@Transactional
	public int sync(List<Activity> activities) {
		int saved = 0;
		for (Activity a : activities) {
			if (a.getId() == null) {
				a.setId(UUID.randomUUID());
			}
			activityRepository.save(a);
			saved++;
		}
		return saved;
	}
}
