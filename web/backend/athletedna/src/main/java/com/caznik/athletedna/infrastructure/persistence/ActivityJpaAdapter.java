package com.caznik.athletedna.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
		// incoming domain object so JPA performs an UPDATE. (For FIT enrichment the
		// service has already copied both the matched row's id and externalStravaId, so
		// this resolves to the same row and the merge UPDATEs it — AC-6.)
		if (activity.getExternalStravaId() != null) {
			Optional<ActivityEntity> existing = jpaRepository.findByExternalStravaId(activity.getExternalStravaId());
			if (existing.isPresent()) {
				ActivityEntity existingEntity = existing.get();
				// AC-13 — FIT-first durability. Once a row is source="fit" (enriched from a
				// FIT file, AC-6), a later Strava upsert of the same external_strava_id
				// carries only base fields (source/fitFileHash null, all FIT summary columns
				// null, no laps). Rebuilding the entity from that would wipe source, the FIT
				// summary columns, and orphan-remove the laps. So on the protected path we
				// mutate ONLY the Strava-owned base columns on the existing entity and leave
				// source, the FIT summary columns, and the lap collection untouched. The lap
				// collection is never accessed here, so the merge does not replace it.
				if ("fit".equals(existingEntity.getSource()) && !isFitSourced(activity)) {
					existingEntity.setType(activity.getType());
					existingEntity.setDistance(activity.getDistance());
					existingEntity.setDurationSeconds(activity.getDurationSeconds());
					existingEntity.setAvgHr(activity.getAvgHeartRate());
					existingEntity.setStartDate(activity.getStartDate());
					jpaRepository.save(existingEntity);
					return;
				}
				activity.setId(existingEntity.getId());
			}
		}
		// Merging a freshly-built entity whose id matches an existing row replaces its
		// lap collection; orphanRemoval=true deletes any superseded laps on flush.
		jpaRepository.save(ActivityPersistenceMapper.toEntity(activity));
	}

	// An incoming activity is FIT-sourced (a genuine FIT import/re-import, which must be
	// allowed to overwrite — AC-6) when it carries source="fit" or a FIT file hash. A
	// Strava upsert has both null, so it takes the FIT-protected path above (AC-13).
	private static boolean isFitSourced(Activity activity) {
		return "fit".equals(activity.getSource()) || activity.getFitFileHash() != null;
	}

	@Override
	public Optional<Activity> findByFitFileHash(String fitFileHash) {
		return jpaRepository.findByFitFileHash(fitFileHash)
			.map(ActivityPersistenceMapper::toDomain);
	}

	@Override
	public List<Activity> findByUserIdAndStartDateBetween(UUID userId, Instant from, Instant to) {
		return jpaRepository.findByUserIdAndStartDateBetween(userId, from, to).stream()
			.map(ActivityPersistenceMapper::toDomain)
			.toList();
	}

	@Override
	public List<Activity> findByUserId(UUID userId) {
		return jpaRepository.findByUserId(userId).stream()
			.map(ActivityPersistenceMapper::toDomain)
			.toList();
	}

	@Override
	public ActivityPage findPage(UUID userId, int page, int size, String type) {
		// Newest-first; activities without a start date sort last (parity with the
		// in-memory adapter and the previous client-side sort that treated null as 0).
		// nullsLast() is set explicitly so the order is identical on H2 and Postgres,
		// whose default null handling for DESC differs.
		PageRequest pageRequest = PageRequest.of(
			page, size, Sort.by(Sort.Order.desc("startDate").nullsLast()));
		Page<ActivityEntity> result = jpaRepository.findPage(userId, type, pageRequest);
		List<Activity> items = result.getContent().stream()
			.map(ActivityPersistenceMapper::toDomain)
			.toList();
		return new ActivityPage(items, result.getTotalElements());
	}

	@Override
	public List<String> findDistinctTypes(UUID userId) {
		return jpaRepository.findDistinctTypes(userId);
	}
}
