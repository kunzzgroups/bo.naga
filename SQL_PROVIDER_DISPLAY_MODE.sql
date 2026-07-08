-- Run this once if your database is not using spring.jpa.hibernate.ddl-auto=update.
ALTER TABLE game_category
  ADD COLUMN display_mode VARCHAR(30) NOT NULL DEFAULT 'PROVIDER';

-- Example setup:
-- HOT GAME direct shows games immediately
-- LIVE GAME direct shows games immediately
-- SLOT provider first shows provider cards first
UPDATE game_category SET display_mode = 'DIRECT_GAME' WHERE UPPER(name) LIKE '%HOT%';
UPDATE game_category SET display_mode = 'DIRECT_GAME' WHERE UPPER(name) LIKE '%LIVE%';
UPDATE game_category SET display_mode = 'PROVIDER' WHERE UPPER(name) LIKE '%SLOT%';
