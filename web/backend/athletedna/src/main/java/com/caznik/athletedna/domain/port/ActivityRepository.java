package com.caznik.athletedna.domain.port;

import java.util.List;
import java.util.UUID;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;

public interface ActivityRepository {
	void save(Activity activity);

	// All of a single user's activities (unordered). Used by the insight engine and
	// the unpaged dashboard read. Reads are user-scoped: there is no global findAll.
	List<Activity> findByUserId(UUID userId);

	// Paged, newest-first (by startDate, null dates last) slice of the user's activities.
	// A null type means "all types"; otherwise only activities of that type.
	ActivityPage findPage(UUID userId, int page, int size, String type);

	// Distinct activity types present for the user, sorted, for the type filter.
	List<String> findDistinctTypes(UUID userId);
}
