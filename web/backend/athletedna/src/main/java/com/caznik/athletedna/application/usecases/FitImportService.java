package com.caznik.athletedna.application.usecases;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.fit.FitParseException;
import com.caznik.athletedna.application.port.in.ImportFitFilesUseCase;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.FitImportItemResult;
import com.caznik.athletedna.domain.model.FitImportSummary;
import com.caznik.athletedna.domain.port.ActivityRepository;
import com.caznik.athletedna.domain.port.FitActivityParser;
import com.caznik.athletedna.domain.service.SportTypeMapper;

@Service
@Profile("jpa")
public class FitImportService implements ImportFitFilesUseCase {

	// Same-source-window for FIT-first enrichment: a FIT file whose start_time is within
	// 60s of an existing activity of the same canonical type is treated as that activity.
	private static final Duration ENRICH_WINDOW = Duration.ofSeconds(60);

	// Per-file upload cap. Real FIT files are tiny (largest in the corpus is ~359KB);
	// this only guards against an accidental huge upload, surfaced as a failed result
	// rather than a container error.
	private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;

	private static final String FIT_SOURCE = "fit";

	private final ActivityRepository activityRepository;
	private final FitActivityParser fitActivityParser;
	private final SportTypeMapper sportTypeMapper;
	private final CurrentUserProvider currentUserProvider;

	public FitImportService(
		ActivityRepository activityRepository,
		FitActivityParser fitActivityParser,
		SportTypeMapper sportTypeMapper,
		CurrentUserProvider currentUserProvider
	) {
		this.activityRepository = activityRepository;
		this.fitActivityParser = fitActivityParser;
		this.sportTypeMapper = sportTypeMapper;
		this.currentUserProvider = currentUserProvider;
	}

	@Override
	public FitImportSummary importForCurrentUser(List<NamedBytes> files) {
		UUID userId = currentUserProvider.current().getId();
		List<FitImportItemResult> results = new ArrayList<>();
		for (NamedBytes file : files) {
			results.add(importOne(userId, file));
		}
		return FitImportSummary.from(results);
	}

	// One file. Every failure mode (bad name, oversize, non-FIT/corrupt bytes) returns a
	// FAILED result and never throws, so the loop above continues to the next file (AC-9).
	private FitImportItemResult importOne(UUID userId, NamedBytes file) {
		String name = file.filename() == null ? "(unnamed)" : file.filename();

		String validation = validate(name, file.bytes());
		if (validation != null) {
			return FitImportItemResult.failed(name, validation);
		}

		String hash = sha256Hex(file.bytes());

		// (1) Identity dedup: identical bytes already imported ⇒ no write (AC-5).
		Optional<Activity> existing = activityRepository.findByFitFileHash(hash);
		if (existing.isPresent()) {
			return FitImportItemResult.duplicate(name, existing.get().getId());
		}

		// (2) Decode.
		Activity parsed;
		try {
			parsed = fitActivityParser.parse(file.bytes());
		} catch (FitParseException ex) {
			return FitImportItemResult.failed(name, ex.getMessage());
		}

		// (3) Canonical type (never null, AC-11) + ownership/source/identity stamping.
		String canonicalType = sportTypeMapper.toCanonicalType(parsed.getSport());
		parsed.setType(canonicalType);
		parsed.setUserId(userId);
		parsed.setSource(FIT_SOURCE);
		parsed.setFitFileHash(hash);

		// (4) FIT-first enrichment: an existing same-type activity within ±60s of the FIT
		// start time is enriched in place; FIT values win and external_strava_id is kept.
		Optional<Activity> match = findEnrichmentMatch(userId, parsed, canonicalType);
		if (match.isPresent()) {
			Activity target = match.get();
			parsed.setId(target.getId());
			parsed.setExternalStravaId(target.getExternalStravaId());
			activityRepository.save(parsed);
			return FitImportItemResult.enriched(name, target.getId());
		}

		// (5) No match ⇒ insert a new activity (AC-7).
		UUID newId = UUID.randomUUID();
		parsed.setId(newId);
		activityRepository.save(parsed);
		return FitImportItemResult.imported(name, newId);
	}

	private Optional<Activity> findEnrichmentMatch(UUID userId, Activity parsed, String canonicalType) {
		Instant start = parsed.getStartDate();
		if (start == null) {
			return Optional.empty();
		}
		List<Activity> window = activityRepository.findByUserIdAndStartDateBetween(
			userId, start.minus(ENRICH_WINDOW), start.plus(ENRICH_WINDOW));
		return window.stream()
			.filter(a -> canonicalType.equals(a.getType()))
			// Never enrich an already-FIT-sourced row; the match target is the Strava
			// (or legacy) activity. Prefer a Strava row so external_strava_id is preserved.
			.filter(a -> !FIT_SOURCE.equals(a.getSource()))
			.findFirst();
	}

	// Returns a human-readable reason if the file is rejected up front, else null.
	private String validate(String name, byte[] bytes) {
		if (bytes == null || bytes.length == 0) {
			return "Empty file";
		}
		if (bytes.length > MAX_FILE_BYTES) {
			return "File exceeds the " + (MAX_FILE_BYTES / (1024 * 1024)) + " MB limit";
		}
		if (!name.toLowerCase(Locale.ROOT).endsWith(".fit")) {
			return "Not a .fit file";
		}
		return null;
	}

	private static String sha256Hex(byte[] bytes) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
			StringBuilder sb = new StringBuilder(digest.length * 2);
			for (byte b : digest) {
				sb.append(Character.forDigit((b >> 4) & 0xF, 16));
				sb.append(Character.forDigit(b & 0xF, 16));
			}
			return sb.toString();
		} catch (NoSuchAlgorithmException ex) {
			// SHA-256 is mandated by the JLS to be present on every JVM.
			throw new IllegalStateException("SHA-256 unavailable", ex);
		}
	}
}
