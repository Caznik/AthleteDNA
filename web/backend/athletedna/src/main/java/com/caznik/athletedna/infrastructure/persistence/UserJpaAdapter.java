package com.caznik.athletedna.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;
import com.caznik.athletedna.infrastructure.persistence.mappers.UserPersistenceMapper;

@Repository
@Profile("jpa")
public class UserJpaAdapter implements UserRepository {

	private final UserJpaRepository jpaRepository;

	public UserJpaAdapter(UserJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Optional<User> findById(UUID id) {
		return jpaRepository.findById(id).map(UserPersistenceMapper::toDomain);
	}

	@Override
	public Optional<User> findByEmail(String email) {
		return jpaRepository.findByEmail(email).map(UserPersistenceMapper::toDomain);
	}

	@Override
	public Optional<User> findByUsername(String username) {
		return jpaRepository.findByUsername(username).map(UserPersistenceMapper::toDomain);
	}

	@Override
	public User save(User user) {
		return UserPersistenceMapper.toDomain(
			jpaRepository.save(UserPersistenceMapper.toEntity(user))
		);
	}
}
