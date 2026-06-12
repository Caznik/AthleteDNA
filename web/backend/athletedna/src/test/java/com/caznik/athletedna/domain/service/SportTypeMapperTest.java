package com.caznik.athletedna.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class SportTypeMapperTest {

	private final SportTypeMapper mapper = new SportTypeMapper();

	// Table-driven over EVERY distinct FIT sport value present in the data_fit/ corpus
	// (verified by probe: running, cycling, walking, hiking, rowing, training,
	// fitness_equipment, generic) → its canonical type (AC-11).
	static Stream<Arguments> corpusSports() {
		return Stream.of(
			Arguments.of("running", "Run"),
			Arguments.of("cycling", "Ride"),
			Arguments.of("walking", "Walk"),
			Arguments.of("hiking", "Hike"),
			Arguments.of("rowing", "Rowing"),
			Arguments.of("training", "Workout"),
			Arguments.of("fitness_equipment", "Workout"),
			Arguments.of("generic", "Workout")
		);
	}

	@ParameterizedTest
	@MethodSource("corpusSports")
	void mapsEveryCorpusSportToItsCanonicalType(String fitSport, String expected) {
		assertThat(mapper.toCanonicalType(fitSport)).isEqualTo(expected);
	}

	// The Garmin SDK returns the upper-case enum name; mapping must be case-insensitive.
	@ParameterizedTest
	@ValueSource(strings = {"RUNNING", "Running", "running"})
	void mappingIsCaseInsensitive(String fitSport) {
		assertThat(mapper.toCanonicalType(fitSport)).isEqualTo("Run");
	}

	@Test
	void unknownSportFallsBackToWorkout() {
		assertThat(mapper.toCanonicalType("kayaking")).isEqualTo("Workout");
	}

	@Test
	void nullSportFallsBackToWorkoutNeverNull() {
		assertThat(mapper.toCanonicalType(null)).isEqualTo("Workout");
	}
}
