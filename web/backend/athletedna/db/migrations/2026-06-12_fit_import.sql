-- WI-fit-import / 20260612-fit-file-parser
--
-- Adds FIT-import support to the activities schema: per-session summary columns, the
-- relational activity_laps table, a SHA-256 dedup identity, and a source marker.
--
-- Why a hand-written script: the app runs Hibernate with spring.jpa.hibernate.ddl-auto=update
-- (see application-jpa.properties). ddl-auto=update ADDS the new nullable summary columns on
-- `activities` and CREATES the `activity_laps` table automatically from the entity mappings.
-- What it does NOT do reliably is (a) the UNIQUE index on fit_file_hash and (b) backfilling
-- the source marker on existing rows. Those are applied explicitly here. No migration
-- framework (Flyway/Liquibase) is in use; apply this manually once per environment.
--
-- This script is re-runnable (IF NOT EXISTS / idempotent UPDATE).
--
-- Run command (from backend/athletedna):
--   psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-12_fit_import.sql

-- 1. Summary columns (ddl-auto=update normally adds these; IF NOT EXISTS makes the script
--    safe to run before or after the app has booted against the new entity).
ALTER TABLE activities ADD COLUMN IF NOT EXISTS source                    varchar(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS fit_file_hash             varchar(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sport                     varchar(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sub_sport                 varchar(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_elapsed_time        double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_timer_time          double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_calories            integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_heart_rate            integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS min_heart_rate            integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_power                 integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_power                 integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS normalized_power          integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_work                bigint;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_cadence               integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_cadence               integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_step_length           double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_ascent              integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS total_descent             integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_temperature           integer;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_speed                 double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS max_speed                 double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_stance_time           double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_vertical_oscillation  double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS avg_vertical_ratio        double precision;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS manufacturer              varchar(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS product_name              varchar(255);

-- 2. Dedup identity: re-uploading identical bytes must be a no-op (AC-5). Postgres treats
--    NULLs as distinct under a unique index, so existing Strava rows (null hash) never collide.
CREATE UNIQUE INDEX IF NOT EXISTS uq_activities_fit_file_hash
	ON activities (fit_file_hash);

-- 3. Backfill source on existing rows so they read as Strava-sourced. (The DTO boundary
--    already coerces a null source to "strava", so this is belt-and-suspenders for any
--    consumer that queries the column directly.)
UPDATE activities SET source = 'strava' WHERE source IS NULL;

-- 4. activity_laps (ddl-auto=update creates it from ActivityLapEntity; this block documents
--    the shape and ensures the FK + ordering index exist for direct-SQL environments).
CREATE TABLE IF NOT EXISTS activity_laps (
	id                  uuid PRIMARY KEY,
	activity_id         uuid NOT NULL REFERENCES activities (id),
	message_index       integer,
	start_time          timestamptz,
	timestamp           timestamptz,
	total_timer_time    double precision,
	total_elapsed_time  double precision,
	total_distance      double precision,
	total_calories      integer,
	avg_heart_rate      integer,
	max_heart_rate      integer,
	min_heart_rate      integer,
	avg_cadence         integer,
	max_cadence         integer,
	avg_speed           double precision,
	max_speed           double precision,
	avg_power           integer,
	total_ascent        integer,
	total_descent       integer,
	avg_temperature     integer
);

-- Laps are read back ordered by message_index for a given activity (AC-3).
CREATE INDEX IF NOT EXISTS idx_activity_laps_activity_id
	ON activity_laps (activity_id, message_index);
