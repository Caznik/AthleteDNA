package com.caznik.athletedna.domain.port;

import java.util.List;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;

public interface ActivityRepository {
	void save(Activity activity);
	List<Activity> findAll();

	// Paged, newest-first (by startDate, null dates last) slice of activities.
	// A null type means "all types"; otherwise only activities of that type.
	ActivityPage findPage(int page, int size, String type);

	// Distinct activity types present in storage, sorted, for the type filter.
	List<String> findDistinctTypes();
}
