-- Migration 007: Add schema_version and variant columns to generated_content
-- schema_version: allows natural bypass of stale cache entries when content shape changes
-- variant: game-specific sub-key beyond topic/difficulty (e.g. grammarTarget for grammar-boss)

ALTER TABLE generated_content
  ADD COLUMN schema_version int NOT NULL DEFAULT 1,
  ADD COLUMN variant text;  -- nullable; game-specific sub-key

-- Update the lookup index to include variant for efficient filtered queries
DROP INDEX IF EXISTS idx_generated_content_lookup;
CREATE INDEX idx_generated_content_lookup
  ON generated_content(game_key, topic, difficulty, variant);
