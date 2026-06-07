-- WI-insight-engine / 20260605-statistical-training-metrics
--
-- Make activities owned per-user: add activities.user_id, backfill existing rows, then
-- enforce NOT NULL + a foreign key to users(id) and index the column.
--
-- Why a hand-written script: the app runs Hibernate with spring.jpa.hibernate.ddl-auto=update
-- (see application-jpa.properties). ddl-auto=update ADDS the nullable user_id column on its
-- own, but it never backfills data and never adds a NOT NULL constraint or a foreign key to
-- already-populated rows. Those steps must be applied explicitly here. No migration framework
-- (Flyway/Liquibase) is in use; apply this manually once per environment.
--
-- Backfill rule: this app has been effectively single-user, so every pre-existing activity
-- is assigned to the one existing user. IF YOU HAVE MORE THAN ONE USER, replace the SELECT
-- in the UPDATE with the intended owner's UUID before running.
--
-- Run command (from backend/athletedna):
--   psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-07_activity_user_id.sql

-- 1. Column (ddl-auto=update may have already added it; IF NOT EXISTS makes this re-runnable).
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Backfill existing rows to the single existing user.
UPDATE activities
SET user_id = (SELECT id FROM users ORDER BY id LIMIT 1)
WHERE user_id IS NULL;

-- 3. Enforce NOT NULL (idempotent — no-op if already set).
ALTER TABLE activities ALTER COLUMN user_id SET NOT NULL;

-- 4. Foreign key to users(id), added only if absent so the script is safe to re-run.
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE constraint_name = 'fk_activities_user'
		  AND table_name = 'activities'
	) THEN
		ALTER TABLE activities
			ADD CONSTRAINT fk_activities_user
			FOREIGN KEY (user_id) REFERENCES users (id);
	END IF;
END $$;

-- 5. Index the FK column (per-user reads filter on it).
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id);
