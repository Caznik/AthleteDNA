package com.caznik.athletedna.application.strava;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("jpa")
public class OAuthStateService {

	private static final Duration STATE_TTL = Duration.ofMinutes(10);
	private static final int STATE_BYTES = 32;

	private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();
	private final SecureRandom secureRandom = new SecureRandom();
	private final Clock clock;

	@Autowired
	public OAuthStateService() {
		this(Clock.systemUTC());
	}

	// Visible for testing — lets tests inject a fixed clock to simulate TTL expiry.
	public OAuthStateService(Clock clock) {
		this.clock = clock;
	}

	public String issueState(UUID userId) {
		byte[] raw = new byte[STATE_BYTES];
		secureRandom.nextBytes(raw);
		String state = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
		store.put(state, new Entry(userId, clock.instant()));
		return state;
	}

	// Single-use: the entry is removed before the TTL check so a double-consume
	// always returns empty, even when within the window.
	public Optional<UUID> consumeState(String state) {
		if (state == null) {
			return Optional.empty();
		}
		Entry entry = store.remove(state);
		if (entry == null) {
			return Optional.empty();
		}
		if (clock.instant().isAfter(entry.issuedAt().plus(STATE_TTL))) {
			return Optional.empty();
		}
		return Optional.of(entry.userId());
	}

	private record Entry(UUID userId, Instant issuedAt) {}
}
