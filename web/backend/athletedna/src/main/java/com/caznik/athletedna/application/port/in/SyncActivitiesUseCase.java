package com.caznik.athletedna.application.port.in;

import java.util.List;

import com.caznik.athletedna.domain.model.Activity;

public interface SyncActivitiesUseCase {
	int sync(List<Activity> activities);
}
