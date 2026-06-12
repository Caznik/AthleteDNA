package com.caznik.athletedna.domain.port;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;

public interface ActivityRepository {
	void save(Activity activity);

	// Lookup by the SHA-256 FIT identity. Present ⇒ the same bytes were already
	// imported, so re-upload is a no-op duplicate (AC-5).
	Optional<Activity> findByFitFileHash(String fitFileHash);

	// All of a user's activities whose startDate falls in [from, to]. Powers the
	// FIT-first enrichment match against an existing Strava activity (AC-6).
	List<Activity> findByUserIdAndStartDateBetween(UUID userId, Instant from, Instant to);

	// All of a single user's activities (unordered). Used by the insight engine and
	// the unpaged dashboard read. Reads are user-scoped: there is no global findAll.
	List<Activity> findByUserId(UUID userId);

	// Paged, newest-first (by startDate, null dates last) slice of the user's activities.
	// A null type means "all types"; otherwise only activities of that type.
	ActivityPage findPage(UUID userId, int page, int size, String type);

	// Distinct activity types present for the user, sorted, for the type filter.
	List<String> findDistinctTypes(UUID userId);
}
