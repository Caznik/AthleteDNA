package com.caznik.athletedna.domain.port;

import java.util.Optional;
import java.util.UUID;

import com.caznik.athletedna.domain.model.StravaAccount;

public interface StravaAccountRepository {
	Optional<StravaAccount> findByUserId(UUID userId);
	StravaAccount save(StravaAccount account);
}
