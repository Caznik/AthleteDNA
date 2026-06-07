package com.caznik.athletedna.infrastructure.persistence.mappers;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;

public class ActivityPersistenceMapper {

	public static Activity toDomain(ActivityEntity entity) {
		Activity activity = new Activity(
			entity.getId(),
			entity.getType(),
			entity.getDistance(),
			entity.getDurationSeconds(),
			entity.getAvgHr(),
			entity.getExternalStravaId(),
			entity.getStartDate()
		);
		activity.setUserId(entity.getUserId());
		return activity;
	}

	public static ActivityEntity toEntity(Activity activity) {
		ActivityEntity entity = new ActivityEntity();
		entity.setId(activity.getId());
		entity.setUserId(activity.getUserId());
		entity.setType(activity.getType());
		entity.setDistance(activity.getDistance());
		entity.setDurationSeconds(activity.getDurationSeconds());
		entity.setAvgHr(activity.getAvgHeartRate());
		entity.setExternalStravaId(activity.getExternalStravaId());
		entity.setStartDate(activity.getStartDate());
		return entity;
	}
}
