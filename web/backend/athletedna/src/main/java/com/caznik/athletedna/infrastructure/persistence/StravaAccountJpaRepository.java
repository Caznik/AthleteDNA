package com.caznik.athletedna.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.caznik.athletedna.infrastructure.persistence.entities.StravaAccountEntity;

interface StravaAccountJpaRepository extends JpaRepository<StravaAccountEntity, UUID> {
	Optional<StravaAccountEntity> findByUserId(UUID userId);
}
