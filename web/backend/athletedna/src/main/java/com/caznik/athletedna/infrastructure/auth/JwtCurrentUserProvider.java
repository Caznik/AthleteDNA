package com.caznik.athletedna.infrastructure.auth;

import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.caznik.athletedna.application.CurrentUserProvider;
import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

// Real auth implementation of the CurrentUserProvider seam. Reads the user id
// that JwtAuthenticationFilter resolved for the in-flight request and loads the
// user. Throws UnauthenticatedException (→ 401) when there is no valid session.
@Service
@Profile("jpa")
public class JwtCurrentUserProvider implements CurrentUserProvider {

	private final UserRepository userRepository;

	public JwtCurrentUserProvider(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public User current() {
		if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
			throw new UnauthenticatedException();
		}
		Object userId = attributes.getRequest().getAttribute(JwtAuthenticationFilter.USER_ID_ATTRIBUTE);
		if (!(userId instanceof UUID id)) {
			throw new UnauthenticatedException();
		}
		return userRepository.findById(id).orElseThrow(UnauthenticatedException::new);
	}
}
