-- WI-profile-photo / 20260602-profile-photo-upload
--
-- Add three nullable columns to users to store an uploaded profile photo inline:
--   photo               (bytea)       -- raw image bytes (<= 2 MB enforced in the app)
--   photo_content_type  (varchar 64)  -- declared MIME type (image/jpeg|png|webp)
--   photo_updated_at     (timestamptz) -- last upload/replace time; doubles as the
--                                         frontend cache-buster (?v= token)
--
-- Why a hand-written script: the app runs Hibernate with spring.jpa.hibernate.ddl-auto=update
-- (see application-jpa.properties). ddl-auto=update ADDS new nullable columns automatically,
-- so the entity change alone is enough on a live DB. This script documents the change
-- explicitly per project convention; no migration framework (Flyway/Liquibase) is in use.
-- IF NOT EXISTS makes it safe to re-run after ddl-auto has already added the columns.
--
-- Run command (from backend/athletedna):
--   psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-02_user_profile_photo.sql

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS photo bytea,
	ADD COLUMN IF NOT EXISTS photo_content_type varchar(64),
	ADD COLUMN IF NOT EXISTS photo_updated_at timestamptz;
