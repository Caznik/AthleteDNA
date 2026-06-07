package com.caznik.athletedna.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.caznik.athletedna.infrastructure.persistence.entities.ActivityEntity;

interface ActivityJpaRepository extends JpaRepository<ActivityEntity, UUID> {
	Optional<ActivityEntity> findByExternalStravaId(Long externalStravaId);

	List<ActivityEntity> findByUserId(UUID userId);

	// Scoped to one user. A null :type matches everything; otherwise filters by exact
	// type. Ordering is supplied by the Pageable's Sort so null start dates sort last.
	@Query("select a from ActivityEntity a where a.userId = :userId and (:type is null or a.type = :type)")
	Page<ActivityEntity> findPage(@Param("userId") UUID userId, @Param("type") String type, Pageable pageable);

	@Query("select distinct a.type from ActivityEntity a where a.userId = :userId order by a.type")
	List<String> findDistinctTypes(@Param("userId") UUID userId);
}
