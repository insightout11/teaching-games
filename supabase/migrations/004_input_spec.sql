-- Add input_spec column to sessions table
-- This stores the current InputSpec that the student controller should render

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS input_spec jsonb;

-- Add comment for documentation
COMMENT ON COLUMN sessions.input_spec IS 'Current input specification for student controllers. Contains type, prompt, options, etc.';
