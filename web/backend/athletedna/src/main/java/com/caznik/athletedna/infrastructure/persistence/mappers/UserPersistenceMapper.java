package com.caznik.athletedna.infrastructure.persistence.mappers;

import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.infrastructure.persistence.entities.UserEntity;

public class UserPersistenceMapper {

	public static User toDomain(UserEntity entity) {
		User user = new User(entity.getId(), entity.getEmail(), entity.getUsername(), entity.getPasswordHash());
		user.setPhoto(entity.getPhoto());
		user.setPhotoContentType(entity.getPhotoContentType());
		user.setPhotoUpdatedAt(entity.getPhotoUpdatedAt());
		user.setThemePreference(entity.getThemePreference());
		return user;
	}

	public static UserEntity toEntity(User user) {
		UserEntity entity = new UserEntity();
		entity.setId(user.getId());
		entity.setEmail(user.getEmail());
		entity.setUsername(user.getUsername());
		entity.setPasswordHash(user.getPasswordHash());
		entity.setPhoto(user.getPhoto());
		entity.setPhotoContentType(user.getPhotoContentType());
		entity.setPhotoUpdatedAt(user.getPhotoUpdatedAt());
		entity.setThemePreference(user.getThemePreference());
		return entity;
	}
}
