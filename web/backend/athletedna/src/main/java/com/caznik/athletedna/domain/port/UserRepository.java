package com.caznik.athletedna.domain.port;

import java.util.Optional;
import java.util.UUID;

import com.caznik.athletedna.domain.model.User;

public interface UserRepository {
	Optional<User> findById(UUID id);
	Optional<User> findByEmail(String email);
	Optional<User> findByUsername(String username);
	User save(User user);
}
