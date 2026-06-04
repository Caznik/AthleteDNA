package com.caznik.athletedna.application.strava;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class OAuthStateServiceTest {

	@Test
	void issueAndConsume_returnsBoundUserId() {
		OAuthStateService service = new OAuthStateService();
		UUID userId = UUID.randomUUID();

		String state = service.issueState(userId);
		Optional<UUID> consumed = service.consumeState(state);

		assertThat(consumed).contains(userId);
	}

	@Test
	void consume_isSingleUse() {
		OAuthStateService service = new OAuthStateService();
		UUID userId = UUID.randomUUID();
		String state = service.issueState(userId);

		service.consumeState(state);
		Optional<UUID> second = service.consumeState(state);

		assertThat(second).isEmpty();
	}

	@Test
	void consume_returnsEmptyForUnknownState() {
		OAuthStateService service = new OAuthStateService();

		assertThat(service.consumeState("never-issued")).isEmpty();
	}

	@Test
	void consume_returnsEmptyForNullState() {
		OAuthStateService service = new OAuthStateService();

		assertThat(service.consumeState(null)).isEmpty();
	}

	@Test
	void consume_returnsEmptyAfterTtlExpiry() {
		// Advance the clock past the 10-min TTL between issue and consume.
		Instant t0 = Instant.parse("2026-06-01T12:00:00Z");
		MutableClock clock = new MutableClock(t0);
		OAuthStateService service = new OAuthStateService(clock);
		UUID userId = UUID.randomUUID();
		String state = service.issueState(userId);

		clock.advance(Duration.ofMinutes(11));

		assertThat(service.consumeState(state)).isEmpty();
	}

	private static class MutableClock extends Clock {
		private Instant now;

		MutableClock(Instant initial) { this.now = initial; }

		void advance(Duration d) { now = now.plus(d); }

		@Override public ZoneId getZone() { return ZoneId.of("UTC"); }
		@Override public Clock withZone(ZoneId zone) { return this; }
		@Override public Instant instant() { return now; }
	}
}
