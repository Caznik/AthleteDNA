package com.caznik.athletedna.infrastructure.persistence.mappers;

import java.util.UUID;

import com.caznik.athletedna.domain.model.ActivityLap;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityLapEntity;

public class ActivityLapPersistenceMapper {

	public static ActivityLap toDomain(ActivityLapEntity entity) {
		ActivityLap lap = new ActivityLap();
		lap.setMessageIndex(entity.getMessageIndex());
		lap.setStartTime(entity.getStartTime());
		lap.setTimestamp(entity.getTimestamp());
		lap.setTotalTimerTime(entity.getTotalTimerTime());
		lap.setTotalElapsedTime(entity.getTotalElapsedTime());
		lap.setTotalDistance(entity.getTotalDistance());
		lap.setTotalCalories(entity.getTotalCalories());
		lap.setAvgHeartRate(entity.getAvgHeartRate());
		lap.setMaxHeartRate(entity.getMaxHeartRate());
		lap.setMinHeartRate(entity.getMinHeartRate());
		lap.setAvgCadence(entity.getAvgCadence());
		lap.setMaxCadence(entity.getMaxCadence());
		lap.setAvgSpeed(entity.getAvgSpeed());
		lap.setMaxSpeed(entity.getMaxSpeed());
		lap.setAvgPower(entity.getAvgPower());
		lap.setTotalAscent(entity.getTotalAscent());
		lap.setTotalDescent(entity.getTotalDescent());
		lap.setAvgTemperature(entity.getAvgTemperature());
		return lap;
	}

	// Builds a lap entity owned by `parent`. The lap gets its own UUID; the FK back to
	// the activity is set so the cascading insert wires the relationship.
	public static ActivityLapEntity toEntity(ActivityLap lap, ActivityEntity parent) {
		ActivityLapEntity entity = new ActivityLapEntity();
		entity.setId(UUID.randomUUID());
		entity.setActivity(parent);
		entity.setMessageIndex(lap.getMessageIndex());
		entity.setStartTime(lap.getStartTime());
		entity.setTimestamp(lap.getTimestamp());
		entity.setTotalTimerTime(lap.getTotalTimerTime());
		entity.setTotalElapsedTime(lap.getTotalElapsedTime());
		entity.setTotalDistance(lap.getTotalDistance());
		entity.setTotalCalories(lap.getTotalCalories());
		entity.setAvgHeartRate(lap.getAvgHeartRate());
		entity.setMaxHeartRate(lap.getMaxHeartRate());
		entity.setMinHeartRate(lap.getMinHeartRate());
		entity.setAvgCadence(lap.getAvgCadence());
		entity.setMaxCadence(lap.getMaxCadence());
		entity.setAvgSpeed(lap.getAvgSpeed());
		entity.setMaxSpeed(lap.getMaxSpeed());
		entity.setAvgPower(lap.getAvgPower());
		entity.setTotalAscent(lap.getTotalAscent());
		entity.setTotalDescent(lap.getTotalDescent());
		entity.setAvgTemperature(lap.getAvgTemperature());
		return entity;
	}
}
