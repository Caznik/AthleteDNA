package com.caznik.athletedna.infrastructure.persistence.mappers;

import com.caznik.athletedna.domain.model.StravaAccount;
import com.caznik.athletedna.infrastructure.persistence.entities.StravaAccountEntity;

public class StravaAccountPersistenceMapper {

	public static StravaAccount toDomain(StravaAccountEntity entity) {
		return new StravaAccount(
			entity.getId(),
			entity.getUserId(),
			entity.getStravaAthleteId(),
			entity.getAccessToken(),
			entity.getRefreshToken(),
			entity.getExpiresAt(),
			entity.getScope(),
			entity.getLastSyncedAt()
		);
	}

	public static StravaAccountEntity toEntity(StravaAccount account) {
		StravaAccountEntity entity = new StravaAccountEntity();
		entity.setId(account.getId());
		entity.setUserId(account.getUserId());
		entity.setStravaAthleteId(account.getStravaAthleteId());
		entity.setAccessToken(account.getAccessToken());
		entity.setRefreshToken(account.getRefreshToken());
		entity.setExpiresAt(account.getExpiresAt());
		entity.setScope(account.getScope());
		entity.setLastSyncedAt(account.getLastSyncedAt());
		return entity;
	}
}
