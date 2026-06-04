package com.caznik.athletedna.infrastructure.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.port.ActivityRepository;

@Repository
@Profile("!jpa")
public class ActivityInMemoryAdapter implements ActivityRepository {

	private final List<Activity> db = new ArrayList<>();

	// Newest-first by start date, nulls last — mirrors the JPA adapter's ordering.
	private static final Comparator<Activity> NEWEST_FIRST =
		Comparator.comparing(Activity::getStartDate,
			Comparator.nullsLast(Comparator.reverseOrder()));

	@Override
	public void save(Activity activity) {
		db.add(activity);
	}

	@Override
	public List<Activity> findAll() {
		return new ArrayList<>(db);
	}

	@Override
	public ActivityPage findPage(int page, int size, String type) {
		List<Activity> matching = db.stream()
			.filter(a -> type == null || type.equals(a.getType()))
			.sorted(NEWEST_FIRST)
			.toList();

		// page/size arrive already clamped (page >= 0, size in 1..100) from the controller.
		int from = Math.min(page * size, matching.size());
		int to = Math.min(from + size, matching.size());
		List<Activity> items = new ArrayList<>(matching.subList(from, to));
		return new ActivityPage(items, matching.size());
	}

	@Override
	public List<String> findDistinctTypes() {
		return db.stream()
			.map(Activity::getType)
			.distinct()
			.sorted()
			.toList();
	}
}
