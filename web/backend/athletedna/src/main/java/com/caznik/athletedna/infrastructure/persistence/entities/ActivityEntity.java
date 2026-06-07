package com.caznik.athletedna.infrastructure.persistence.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "activities")
@NoArgsConstructor
public class ActivityEntity {

	@Id
	@Column(nullable = false, updatable = false)
	private @Getter @Setter UUID id;

	// Owning user. Column is nullable here so ddl-auto=update can add it to existing
	// rows; the NOT NULL + FK to users(id) are applied by the hand-written migration
	// 2026-06-07_activity_user_id.sql after the backfill (ddl-auto can't do that safely).
	@Column(name = "user_id")
	private @Getter @Setter UUID userId;

	@Column(nullable = false, length = 100)
	private @Getter @Setter String type;

	@Column(nullable = false)
	private @Getter @Setter Double distance;

	@Column(nullable = false)
	private @Getter @Setter Long durationSeconds;

	@Column
	private @Getter @Setter Integer avgHr;

	@Column(name = "external_strava_id", unique = true)
	private @Getter @Setter Long externalStravaId;

	@Column(name = "start_date")
	private @Getter @Setter Instant startDate;
}
