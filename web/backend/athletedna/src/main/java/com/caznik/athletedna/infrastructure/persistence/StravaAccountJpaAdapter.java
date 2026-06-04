package com.caznik.athletedna.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.domain.port.StravaAccountRepository;
import com.caznik.athletedna.infrastructure.persistence.entities.StravaAccountEntity;
import com.caznik.athletedna.infrastructure.persistence.mappers.StravaAccountPersistenceMapper;

@Repository
@Profile("jpa")
public class StravaAccountJpaAdapter implements StravaAccountRepository {

	private final StravaAccountJpaRepository jpaRepository;

	public StravaAccountJpaAdapter(StravaAccountJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Optional<StravaAccount> findByUserId(UUID userId) {
		return jpaRepository.findByUserId(userId).map(StravaAccountPersistenceMapper::toDomain);
	}

	@Override
	public StravaAccount save(StravaAccount account) {
		// Upsert by userId: if a row already exists for this user, reuse its id so JPA
		// performs an UPDATE rather than violating the unique constraint on user_id.
		if (account.getId() == null) {
			Optional<StravaAccountEntity> existing = jpaRepository.findByUserId(account.getUserId());
			account.setId(existing.map(StravaAccountEntity::getId).orElseGet(UUID::randomUUID));
		}
		StravaAccountEntity saved = jpaRepository.save(StravaAccountPersistenceMapper.toEntity(account));
		return StravaAccountPersistenceMapper.toDomain(saved);
	}
}
