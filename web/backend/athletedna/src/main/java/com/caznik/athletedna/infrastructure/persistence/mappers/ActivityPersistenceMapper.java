package com.caznik.athletedna.infrastructure.persistence.mappers;

import java.util.List;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityLap;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityLapEntity;

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
		activity.setSource(entity.getSource());
		activity.setFitFileHash(entity.getFitFileHash());
		activity.setSport(entity.getSport());
		activity.setSubSport(entity.getSubSport());
		activity.setTotalElapsedTime(entity.getTotalElapsedTime());
		activity.setTotalTimerTime(entity.getTotalTimerTime());
		activity.setTotalCalories(entity.getTotalCalories());
		activity.setMaxHeartRate(entity.getMaxHeartRate());
		activity.setMinHeartRate(entity.getMinHeartRate());
		activity.setAvgPower(entity.getAvgPower());
		activity.setMaxPower(entity.getMaxPower());
		activity.setNormalizedPower(entity.getNormalizedPower());
		activity.setTotalWork(entity.getTotalWork());
		activity.setAvgCadence(entity.getAvgCadence());
		activity.setMaxCadence(entity.getMaxCadence());
		activity.setAvgStepLength(entity.getAvgStepLength());
		activity.setTotalAscent(entity.getTotalAscent());
		activity.setTotalDescent(entity.getTotalDescent());
		activity.setAvgTemperature(entity.getAvgTemperature());
		activity.setAvgSpeed(entity.getAvgSpeed());
		activity.setMaxSpeed(entity.getMaxSpeed());
		activity.setAvgStanceTime(entity.getAvgStanceTime());
		activity.setAvgVerticalOscillation(entity.getAvgVerticalOscillation());
		activity.setAvgVerticalRatio(entity.getAvgVerticalRatio());
		activity.setManufacturer(entity.getManufacturer());
		activity.setProductName(entity.getProductName());
		List<ActivityLap> laps = entity.getLaps().stream()
			.map(ActivityLapPersistenceMapper::toDomain)
			.toList();
		activity.setLaps(new java.util.ArrayList<>(laps));
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
		entity.setSource(activity.getSource());
		entity.setFitFileHash(activity.getFitFileHash());
		entity.setSport(activity.getSport());
		entity.setSubSport(activity.getSubSport());
		entity.setTotalElapsedTime(activity.getTotalElapsedTime());
		entity.setTotalTimerTime(activity.getTotalTimerTime());
		entity.setTotalCalories(activity.getTotalCalories());
		entity.setMaxHeartRate(activity.getMaxHeartRate());
		entity.setMinHeartRate(activity.getMinHeartRate());
		entity.setAvgPower(activity.getAvgPower());
		entity.setMaxPower(activity.getMaxPower());
		entity.setNormalizedPower(activity.getNormalizedPower());
		entity.setTotalWork(activity.getTotalWork());
		entity.setAvgCadence(activity.getAvgCadence());
		entity.setMaxCadence(activity.getMaxCadence());
		entity.setAvgStepLength(activity.getAvgStepLength());
		entity.setTotalAscent(activity.getTotalAscent());
		entity.setTotalDescent(activity.getTotalDescent());
		entity.setAvgTemperature(activity.getAvgTemperature());
		entity.setAvgSpeed(activity.getAvgSpeed());
		entity.setMaxSpeed(activity.getMaxSpeed());
		entity.setAvgStanceTime(activity.getAvgStanceTime());
		entity.setAvgVerticalOscillation(activity.getAvgVerticalOscillation());
		entity.setAvgVerticalRatio(activity.getAvgVerticalRatio());
		entity.setManufacturer(activity.getManufacturer());
		entity.setProductName(activity.getProductName());
		// Build the lap entities with the FK back to this activity. Replacing the
		// collection (rather than mutating in place) is fine for inserts; the adapter
		// handles the orphan-removal path on re-enrich.
		if (activity.getLaps() != null) {
			List<ActivityLapEntity> lapEntities = activity.getLaps().stream()
				.map(lap -> ActivityLapPersistenceMapper.toEntity(lap, entity))
				.toList();
			entity.getLaps().addAll(lapEntities);
		}
		return entity;
	}
}
