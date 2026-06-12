package com.caznik.athletedna.infrastructure.fit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import com.caznik.athletedna.application.fit.FitParseException;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityLap;

class GarminFitParserAdapterTest {

	private final GarminFitParserAdapter parser = new GarminFitParserAdapter();

	private byte[] sample(String name) throws IOException {
		try (InputStream in = getClass().getResourceAsStream("/fit/" + name)) {
			assertThat(in).as("test resource /fit/" + name).isNotNull();
			return in.readAllBytes();
		}
	}

	// AC-1 — every committed sample decodes with a non-null session + lap list, 0 errors.
	@Test
	void decodesEveryCommittedSampleWithoutError() throws IOException {
		for (String name : List.of(
			"465327510182199303.fit",
			"470457109882896683.fit",
			"465979053497679873.fit",
			"472057371751907533.fit",
			"468305045113307145.fit"
		)) {
			Activity activity = parser.parse(sample(name));
			assertThat(activity).as(name).isNotNull();
			assertThat(activity.getSport()).as(name + " sport").isNotNull();
			assertThat(activity.getLaps()).as(name + " laps").isNotEmpty();
		}
	}

	// AC-2 — the running reference file's session summary maps to the expected values.
	@Test
	void mapsRunningReferenceSessionSummary() throws IOException {
		Activity a = parser.parse(sample("465327510182199303.fit"));

		assertThat(a.getSport()).isEqualTo("running");
		// SDK getTotalDistance is a Float; widening to double yields 5585.68017…, so the
		// AC-2 value 5585.68 is asserted within float precision.
		assertThat(a.getDistance()).isCloseTo(5585.68, within(0.01));
		assertThat(a.getAvgHeartRate()).isEqualTo(173);
		assertThat(a.getMaxHeartRate()).isEqualTo(184);
		assertThat(a.getAvgPower()).isEqualTo(223);
		assertThat(a.getAvgCadence()).isEqualTo(81);
		assertThat(a.getTotalAscent()).isEqualTo(37);
		assertThat(a.getAvgTemperature()).isEqualTo(22);
		assertThat(a.getManufacturer()).isEqualTo("COROS");
		assertThat(a.getStartDate()).isNotNull();
	}

	// AC-3 — 8 laps, ordered by message_index, first lap totals.
	@Test
	void mapsRunningReferenceLaps() throws IOException {
		Activity a = parser.parse(sample("465327510182199303.fit"));

		assertThat(a.getLaps()).hasSize(8);
		assertThat(a.getLaps())
			.extracting(ActivityLap::getMessageIndex)
			.containsExactly(0, 1, 2, 3, 4, 5, 6, 7);

		ActivityLap first = a.getLaps().get(0);
		assertThat(first.getTotalDistance()).isCloseTo(1000.0, within(0.01));
		assertThat(first.getAvgHeartRate()).isEqualTo(151);
	}

	// AC-4 — a gym/strength file with no distance/power: those stay null, HR/calories and
	// laps are still recorded, no decode failure. (type=Workout is asserted via the mapper.)
	@Test
	void gymStrengthFileHasNullDistanceAndPowerButKeepsHrCaloriesAndLaps() throws IOException {
		Activity a = parser.parse(sample("470457109882896683.fit"));

		assertThat(a.getSport()).isEqualTo("training");
		assertThat(a.getDistance()).isNull();
		assertThat(a.getAvgPower()).isNull();
		assertThat(a.getAvgHeartRate()).isEqualTo(112);
		assertThat(a.getTotalCalories()).isEqualTo(250);
		assertThat(a.getLaps()).isNotEmpty();
	}

	@Test
	void rejectsNonFitBytesWithFitParseException() {
		byte[] garbage = "this is definitely not a FIT file".getBytes();

		assertThatThrownBy(() -> parser.parse(garbage))
			.isInstanceOf(FitParseException.class);
	}

	@Test
	void rejectsEmptyBytes() {
		assertThatThrownBy(() -> parser.parse(new byte[0]))
			.isInstanceOf(FitParseException.class);
	}

	// AC-1 (full corpus) — opt-in: proves all 334 data_fit/ files decode with 0 errors.
	// Not run in CI (the corpus is untracked / ~18MB); run locally with
	//   -Dfit.corpus.dir=C:/lab/Proyectos/AthleteDNA/web/data_fit
	@Test
	@Disabled("opt-in full-corpus regression; set -Dfit.corpus.dir to enable")
	void decodesEntireDataFitCorpusWithZeroErrors() throws IOException {
		String dir = System.getProperty("fit.corpus.dir");
		assertThat(dir).as("fit.corpus.dir system property").isNotNull();

		int count = 0;
		try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(dir), "*.fit")) {
			for (Path p : stream) {
				Activity a = parser.parse(Files.readAllBytes(p));
				assertThat(a.getSport()).as(p.toString()).isNotNull();
				count++;
			}
		}
		assertThat(count).isEqualTo(334);
	}
}
