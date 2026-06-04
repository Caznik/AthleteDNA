package com.caznik.athletedna.infrastructure.strava.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StravaActivityResponse(
	@JsonProperty("id") Long id,
	@JsonProperty("type") String type,
	@JsonProperty("distance") Double distance,
	@JsonProperty("moving_time") Long movingTime,
	@JsonProperty("average_heartrate") Double averageHeartrate,
	@JsonProperty("start_date") String startDate
) {}
