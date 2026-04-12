-- Migration 021: Add reference materials columns to sessions
-- Stores grammar target + AI-generated vocab and expressions for student reference panel

ALTER TABLE public.sessions
  ADD COLUMN grammar_target        text,
  ADD COLUMN reference_vocab       jsonb,   -- [{word: string, definition: string}]
  ADD COLUMN reference_expressions jsonb;   -- [{phrase: string, example: string}]
