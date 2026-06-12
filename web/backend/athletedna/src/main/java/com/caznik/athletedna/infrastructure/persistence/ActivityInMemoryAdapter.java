package com.caznik.athletedna.infrastructure.persistence;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

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
	public Optional<Activity> findByFitFileHash(String fitFileHash) {
		if (fitFileHash == null) {
			return Optional.empty();
		}
		return db.stream()
			.filter(a -> fitFileHash.equals(a.getFitFileHash()))
			.findFirst();
	}

	@Override
	public List<Activity> findByUserIdAndStartDateBetween(UUID userId, Instant from, Instant to) {
		return db.stream()
			.filter(a -> Objects.equals(a.getUserId(), userId))
			.filter(a -> a.getStartDate() != null
				&& !a.getStartDate().isBefore(from)
				&& !a.getStartDate().isAfter(to))
			.toList();
	}

	@Override
	public List<Activity> findByUserId(UUID userId) {
		return db.stream()
			.filter(a -> Objects.equals(a.getUserId(), userId))
			.toList();
	}

	@Override
	public ActivityPage findPage(UUID userId, int page, int size, String type) {
		List<Activity> matching = db.stream()
			.filter(a -> Objects.equals(a.getUserId(), userId))
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
	public List<String> findDistinctTypes(UUID userId) {
		return db.stream()
			.filter(a -> Objects.equals(a.getUserId(), userId))
			.map(Activity::getType)
			.distinct()
			.sorted()
			.toList();
	}
}
