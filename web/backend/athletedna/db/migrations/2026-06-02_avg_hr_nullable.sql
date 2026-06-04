-- WI-nullable-hr / 20260602-avg-hr-nullable
--
-- Drop the NOT NULL constraint on activities.avg_hr so Strava activities that
-- lack heart-rate data (average_heartrate absent) can be persisted with avg_hr = NULL.
--
-- Why a hand-written script: the app runs Hibernate with spring.jpa.hibernate.ddl-auto=update
-- (see application-jpa.properties). ddl-auto=update ADDS columns/tables but never DROPS an
-- existing NOT NULL constraint, so removing @Column(nullable = false) on the entity alone does
-- NOT relax the live Postgres column. This script applies that schema change explicitly.
-- No migration framework (Flyway/Liquibase) is in use; apply it manually once.
--
-- Run command (from backend/athletedna):
--   psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-02_avg_hr_nullable.sql

ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL;
