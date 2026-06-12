package com.caznik.athletedna.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.port.in.ImportFitFilesUseCase.NamedBytes;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.FitImportItemResult.Status;
import com.caznik.athletedna.domain.model.FitImportSummary;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.ActivityRepository;
import com.caznik.athletedna.domain.service.SportTypeMapper;
import com.caznik.athletedna.infrastructure.fit.GarminFitParserAdapter;

// Integration of parse → map → dedup/enrich with a fake repository. Uses the real
// FIT parser + SportTypeMapper against committed sample bytes so the AC values are
// exercised end-to-end through the service.
class FitImportServiceTest {

	private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-0000000000a1");
	// Verified start_time of 465327510182199303.fit.
	private static final Instant RUN_START = Instant.parse("2024-12-06T09:33:47Z");

	private ActivityRepository repository;
	private CurrentUserProvider currentUserProvider;
	private FitImportService service;

	@BeforeEach
	void setUp() {
		repository = mock(ActivityRepository.class);
		currentUserProvider = mock(CurrentUserProvider.class);
		when(currentUserProvider.current()).thenReturn(new User(USER_ID, "u@example.com"));
		when(repository.findByFitFileHash(any())).thenReturn(Optional.empty());
		when(repository.findByUserIdAndStartDateBetween(any(), any(), any())).thenReturn(List.of());
		service = new FitImportService(
			repository, new GarminFitParserAdapter(), new SportTypeMapper(), currentUserProvider);
	}

	private byte[] sample(String name) throws IOException {
		try (InputStream in = getClass().getResourceAsStream("/fit/" + name)) {
			return in.readAllBytes();
		}
	}

	private NamedBytes file(String name) throws IOException {
		return new NamedBytes(name, sample(name));
	}

	// AC-7 — no hash match, no time match → inserts a new fit activity.
	@Test
	void importsNewActivityWhenNoMatch() throws IOException {
		FitImportSummary summary = service.importForCurrentUser(List.of(file("465327510182199303.fit")));

		assertThat(summary.imported()).isEqualTo(1);
		assertThat(summary.results().get(0).status()).isEqualTo(Status.IMPORTED);

		ArgumentCaptor<Activity> saved = ArgumentCaptor.forClass(Activity.class);
		verify(repository).save(saved.capture());
		Activity a = saved.getValue();
		assertThat(a.getSource()).isEqualTo("fit");
		assertThat(a.getType()).isEqualTo("Run");
		assertThat(a.getUserId()).isEqualTo(USER_ID);
		assertThat(a.getExternalStravaId()).isNull();
		assertThat(a.getFitFileHash()).isNotBlank();
		assertThat(a.getId()).isNotNull();
		assertThat(a.getLaps()).hasSize(8);
	}

	// AC-5 — identical-hash row already present → duplicate, no write.
	@Test
	void reportsDuplicateAndDoesNotWriteWhenHashExists() throws IOException {
		Activity existing = new Activity(UUID.randomUUID(), "Run", 1.0, 1L, 1);
		when(repository.findByFitFileHash(any())).thenReturn(Optional.of(existing));

		FitImportSummary summary = service.importForCurrentUser(List.of(file("465327510182199303.fit")));

		assertThat(summary.duplicates()).isEqualTo(1);
		assertThat(summary.results().get(0).status()).isEqualTo(Status.DUPLICATE);
		assertThat(summary.results().get(0).activityId()).isEqualTo(existing.getId());
		verify(repository, never()).save(any());
	}

	// AC-6 — an existing same-type Strava activity within ±60s is enriched in place: FIT
	// values written, its id + external_strava_id preserved, source becomes fit.
	@Test
	void enrichesMatchingStravaActivityPreservingStravaId() throws IOException {
		UUID stravaRowId = UUID.randomUUID();
		Activity strava = new Activity(stravaRowId, "Run", 5000.0, 1700L, 170, 999L, RUN_START.plusSeconds(20));
		strava.setUserId(USER_ID); // source left null → legacy/strava row
		when(repository.findByUserIdAndStartDateBetween(eq(USER_ID), any(), any()))
			.thenReturn(List.of(strava));

		FitImportSummary summary = service.importForCurrentUser(List.of(file("465327510182199303.fit")));

		assertThat(summary.enriched()).isEqualTo(1);
		assertThat(summary.results().get(0).status()).isEqualTo(Status.ENRICHED);
		assertThat(summary.results().get(0).activityId()).isEqualTo(stravaRowId);

		ArgumentCaptor<Activity> saved = ArgumentCaptor.forClass(Activity.class);
		verify(repository).save(saved.capture());
		Activity a = saved.getValue();
		assertThat(a.getId()).isEqualTo(stravaRowId);
		assertThat(a.getExternalStravaId()).isEqualTo(999L);
		assertThat(a.getSource()).isEqualTo("fit");
		assertThat(a.getAvgPower()).isEqualTo(223); // FIT value won
		assertThat(a.getLaps()).hasSize(8);
	}

	// AC-9 — one valid + one corrupt file: valid is imported & persisted, bad one is failed.
	@Test
	void isolatesPerFileFailures() throws IOException {
		NamedBytes good = file("465327510182199303.fit");
		NamedBytes bad = new NamedBytes("broken.fit", "not a fit file".getBytes());

		FitImportSummary summary = service.importForCurrentUser(List.of(good, bad));

		assertThat(summary.results()).hasSize(2);
		assertThat(summary.imported()).isEqualTo(1);
		assertThat(summary.failed()).isEqualTo(1);
		assertThat(summary.results().stream().filter(r -> r.status() == Status.FAILED).findFirst().orElseThrow().error())
			.isNotBlank();
		verify(repository).save(any()); // the good file was persisted
	}

	// AC-11 — a training-sport file maps to the canonical Workout type on import.
	@Test
	void mapsTrainingSportToWorkout() throws IOException {
		FitImportSummary summary = service.importForCurrentUser(List.of(file("470457109882896683.fit")));

		assertThat(summary.imported()).isEqualTo(1);
		ArgumentCaptor<Activity> saved = ArgumentCaptor.forClass(Activity.class);
		verify(repository).save(saved.capture());
		assertThat(saved.getValue().getType()).isEqualTo("Workout");
		assertThat(saved.getValue().getDistance()).isNull();
		assertThat(saved.getValue().getAvgPower()).isNull();
	}

	@Test
	void rejectsNonFitFilenameAsFailedWithoutWrite() {
		FitImportSummary summary = service.importForCurrentUser(
			List.of(new NamedBytes("notes.txt", new byte[] {1, 2, 3})));

		assertThat(summary.failed()).isEqualTo(1);
		assertThat(summary.results().get(0).status()).isEqualTo(Status.FAILED);
		verify(repository, never()).save(any());
	}

	@Test
	void rejectsOversizeFileAsFailed() {
		byte[] huge = new byte[6 * 1024 * 1024];
		FitImportSummary summary = service.importForCurrentUser(
			List.of(new NamedBytes("big.fit", huge)));

		assertThat(summary.failed()).isEqualTo(1);
		verify(repository, never()).save(any());
	}
}
