package com.caznik.athletedna.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.caznik.athletedna.infrastructure.persistence.entities.UserEntity;

interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {
	Optional<UserEntity> findByEmail(String email);
	Optional<UserEntity> findByUsername(String username);
}
