package com.caznik.athletedna.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityPage;
import com.caznik.athletedna.domain.port.ActivityRepository;
import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;
import com.caznik.athletedna.infrastructure.persistence.mappers.ActivityPersistenceMapper;

@Repository
@Profile("jpa")
public class ActivityJpaAdapter implements ActivityRepository {

	private final ActivityJpaRepository jpaRepository;

	public ActivityJpaAdapter(ActivityJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public void save(Activity activity) {
		// Dedupe by externalStravaId: re-syncing the same Strava activity must update
		// the existing row, not insert a duplicate. Copy the existing UUID onto the
		// incoming domain object so JPA performs an UPDATE.
		if (activity.getExternalStravaId() != null) {
			Optional<ActivityEntity> existing = jpaRepository.findByExternalStravaId(activity.getExternalStravaId());
			existing.ifPresent(e -> activity.setId(e.getId()));
		}
		jpaRepository.save(ActivityPersistenceMapper.toEntity(activity));
	}

	@Override
	public List<Activity> findAll() {
		return jpaRepository.findAll().stream()
			.map(ActivityPersistenceMapper::toDomain)
			.toList();
	}

	@Override
	public ActivityPage findPage(int page, int size, String type) {
		// Newest-first; activities without a start date sort last (parity with the
		// in-memory adapter and the previous client-side sort that treated null as 0).
		// nullsLast() is set explicitly so the order is identical on H2 and Postgres,
		// whose default null handling for DESC differs.
		PageRequest pageRequest = PageRequest.of(
			page, size, Sort.by(Sort.Order.desc("startDate").nullsLast()));
		Page<ActivityEntity> result = jpaRepository.findPage(type, pageRequest);
		List<Activity> items = result.getContent().stream()
			.map(ActivityPersistenceMapper::toDomain)
			.toList();
		return new ActivityPage(items, result.getTotalElements());
	}

	@Override
	public List<String> findDistinctTypes() {
		return jpaRepository.findDistinctTypes();
	}
}
