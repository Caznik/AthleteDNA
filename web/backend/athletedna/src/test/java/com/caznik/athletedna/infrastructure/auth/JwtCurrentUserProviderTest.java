package com.caznik.athletedna.infrastructure.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.caznik.athletedna.application.auth.UnauthenticatedException;
import com.caznik.athletedna.domain.model.User;
import com.caznik.athletedna.domain.port.UserRepository;

class JwtCurrentUserProviderTest {

	private UserRepository userRepository;
	private JwtCurrentUserProvider provider;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		userRepository = mock(UserRepository.class);
		provider = new JwtCurrentUserProvider(userRepository);
	}

	@AfterEach
	void tearDown() {
		RequestContextHolder.resetRequestAttributes();
	}

	private void bindRequestWithUserId(UUID id) {
		MockHttpServletRequest request = new MockHttpServletRequest();
		if (id != null) {
			request.setAttribute(JwtAuthenticationFilter.USER_ID_ATTRIBUTE, id);
		}
		RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
	}

	@Test
	void current_returnsUserResolvedFromRequest() {
		bindRequestWithUserId(userId);
		User user = new User(userId, "user@example.com", "hashed");
		when(userRepository.findById(userId)).thenReturn(Optional.of(user));

		assertThat(provider.current()).isSameAs(user);
	}

	@Test
	void current_throwsWhenNoRequestBound() {
		RequestContextHolder.resetRequestAttributes();

		assertThatThrownBy(provider::current).isInstanceOf(UnauthenticatedException.class);
	}

	@Test
	void current_throwsWhenRequestHasNoUserId() {
		bindRequestWithUserId(null);

		assertThatThrownBy(provider::current).isInstanceOf(UnauthenticatedException.class);
	}

	@Test
	void current_throwsWhenUserNoLongerExists() {
		bindRequestWithUserId(userId);
		when(userRepository.findById(userId)).thenReturn(Optional.empty());

		assertThatThrownBy(provider::current).isInstanceOf(UnauthenticatedException.class);
	}
}
