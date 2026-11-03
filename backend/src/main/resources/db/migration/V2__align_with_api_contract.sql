-- Align storage with docs/api.md: users have a single name; courts have type GLASS/WALL plus an
-- indoor flag (the old type INDOOR/OUTDOOR); the slot price belongs to the court's schedule.

ALTER TABLE app_user ADD COLUMN name VARCHAR(200);
UPDATE app_user SET name = TRIM(first_name || ' ' || last_name);
ALTER TABLE app_user ALTER COLUMN name SET NOT NULL;
ALTER TABLE app_user DROP COLUMN first_name;
ALTER TABLE app_user DROP COLUMN last_name;

ALTER TABLE court ADD COLUMN indoor BOOLEAN NOT NULL DEFAULT FALSE;
-- The wall material was never recorded: existing courts default to GLASS.
UPDATE court SET indoor = (type = 'INDOOR'), type = 'GLASS';

ALTER TABLE schedule ADD COLUMN price DECIMAL(8, 2);
UPDATE schedule SET price = (SELECT c.price_per_hour FROM court c WHERE c.id = schedule.court_id);
ALTER TABLE schedule ALTER COLUMN price SET NOT NULL;
ALTER TABLE court DROP COLUMN price_per_hour;
