-- Add conversation layer to curiosity threads so gift briefings
-- weave into the Tippett spiral architecture
ALTER TABLE curiosity_threads
  ADD COLUMN layer TEXT DEFAULT 'origin'
  CHECK (layer IN (
    'origin', 'calling', 'naming', 'embodiment',
    'fracture', 'bridge', 'expanse', 'return'
  ));

-- Backfill existing threads with a sensible default based on domain
UPDATE curiosity_threads SET layer = CASE
  WHEN domain IN ('identity', 'experiences') THEN 'origin'
  WHEN domain IN ('purpose') THEN 'calling'
  WHEN domain IN ('values', 'worldview') THEN 'naming'
  WHEN domain IN ('patterns', 'joys', 'relationships') THEN 'embodiment'
  WHEN domain IN ('struggles') THEN 'fracture'
  WHEN domain IN ('aspirations') THEN 'expanse'
  ELSE 'origin'
END;
