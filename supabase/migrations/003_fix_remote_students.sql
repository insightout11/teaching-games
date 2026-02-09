-- Fix: Allow remote students (joining via /join link) to receive scores
-- The scores.student_id column has NOT NULL constraint which blocks remote students
-- who don't have entries in the students table

-- Make student_id nullable for remote students
ALTER TABLE public.scores ALTER COLUMN student_id DROP NOT NULL;

-- The existing foreign key constraint will still work with null values
-- No need to drop and re-add it since PostgreSQL allows null in nullable FK columns
