package com.caznik.athletedna.application;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.caznik.athletedna.domain.model.User;

// Fallback for the no-database default profile. Under the "jpa" profile the real
// JwtCurrentUserProvider takes over and resolves the logged-in user from the JWT.
@Service
@Profile("!jpa")
public class StubCurrentUserProvider implements CurrentUserProvider {

	public static final UUID STUB_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
	public static final String STUB_USER_EMAIL = "dev@athletedna.local";

	@Override
	public User current() {
		return new User(STUB_USER_ID, STUB_USER_EMAIL);
	}
}
