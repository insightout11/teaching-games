-- Enable realtime for wonder board tables
-- Without this, postgres_changes subscriptions receive no events
ALTER PUBLICATION supabase_realtime ADD TABLE wonder_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE wonder_votes;
