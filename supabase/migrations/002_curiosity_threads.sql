-- Curiosity threads generated from gift briefings
CREATE TABLE curiosity_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN (
    'identity', 'values', 'relationships', 'purpose',
    'experiences', 'patterns', 'aspirations', 'struggles', 'joys', 'worldview'
  )),
  thread TEXT NOT NULL,
  explored BOOLEAN NOT NULL DEFAULT false,
  source_gift_id UUID REFERENCES agent_gifts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_user_unexplored ON curiosity_threads(user_id) WHERE explored = false;

-- RLS
ALTER TABLE curiosity_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_threads" ON curiosity_threads FOR ALL USING (auth.uid() = user_id);

-- Allow recipients to read pending gifts by invite code (for claim flow)
CREATE POLICY "read_pending_gifts" ON agent_gifts FOR SELECT
  USING (status = 'pending');

-- Allow authenticated users to update gifts they're claiming
CREATE POLICY "claim_gift" ON agent_gifts FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (recipient_id = auth.uid());

-- Allow authenticated users to insert connections
CREATE POLICY "insert_connections" ON connections FOR INSERT
  WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);
