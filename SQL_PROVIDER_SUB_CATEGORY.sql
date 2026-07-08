-- Provider-specific sub category / filter tabs
-- Run this once before using provider filter tabs.

ALTER TABLE game_sub_category
ADD COLUMN provider_code VARCHAR(50) NULL AFTER category_id;

CREATE INDEX idx_game_sub_category_provider
ON game_sub_category(provider_code);

CREATE INDEX idx_game_sub_category_category_provider
ON game_sub_category(category_id, provider_code);
