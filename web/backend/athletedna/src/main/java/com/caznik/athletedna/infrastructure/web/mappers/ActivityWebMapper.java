package com.caznik.athletedna.infrastructure.web.mappers;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.service.TrainingLoadCalculator;
import com.caznik.athletedna.infrastructure.web.dtos.ActivityDTO;

@Component
public class ActivityWebMapper {

	private final TrainingLoadCalculator trainingLoadCalculator;

	public ActivityWebMapper(TrainingLoadCalculator trainingLoadCalculator) {
		this.trainingLoadCalculator = trainingLoadCalculator;
	}

	public Activity toDomain(ActivityDTO dto) {
		// trainingLoad is a derived, read-only field: deliberately ignored on input
		// so activities/sync stays compatible with the enriched DTO.
		return new Activity(
			dto.id() != null ? UUID.fromString(dto.id()) : null,
			dto.type(),
			dto.distance(),
			dto.duration() != null ? (long) dto.duration() : null,
			dto.avgHr(),
			dto.externalStravaId(),
			dto.startDate()
		);
	}

	public ActivityDTO toDTO(Activity domain) {
		return new ActivityDTO(
			domain.getId() != null ? domain.getId().toString() : null,
			domain.getType(),
			domain.getDistance(),
			domain.getDurationSeconds() != null ? domain.getDurationSeconds().intValue() : null,
			domain.getAvgHeartRate(),
			domain.getExternalStravaId(),
			domain.getStartDate(),
			trainingLoadCalculator.calculate(domain),
			// Coerce an unwritten source to "strava" so legacy rows need no backfill and
			// the wire contract is always "strava" | "fit" (AC-12), mirroring the
			// theme/language coercion in AuthController.
			domain.getSource() == null ? "strava" : domain.getSource()
		);
	}
}
