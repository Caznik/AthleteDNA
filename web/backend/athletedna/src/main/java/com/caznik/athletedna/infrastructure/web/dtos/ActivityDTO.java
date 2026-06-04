package com.caznik.athletedna.infrastructure.web.dtos;

import java.time.Instant;

public record ActivityDTO(
	String id,
	String type,
	Double distance,
	Integer duration,
	Integer avgHr,
	Long externalStravaId,
	Instant startDate,
	Long trainingLoad
) {}
