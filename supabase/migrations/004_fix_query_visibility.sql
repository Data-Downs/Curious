-- SECURITY FIX: Add querier_id to agent_queries so we can restrict visibility
-- Previously, both users in a connection could see all queries — including
-- queries the OTHER person asked about THEM. This is a privacy violation.

-- Add querier_id column
ALTER TABLE agent_queries ADD COLUMN querier_id UUID REFERENCES auth.users(id);

-- Backfill: we can't know who made past queries, so leave them null
-- They will not be visible under the new policy

-- Drop the old permissive policy
DROP POLICY IF EXISTS "see_queries" ON agent_queries;

-- New policy: only the person who made the query can see it
CREATE POLICY "see_own_queries" ON agent_queries FOR SELECT
  USING (querier_id = auth.uid());

-- Update insert policy to require querier_id matches auth.uid()
DROP POLICY IF EXISTS "insert_own_queries" ON agent_queries;

CREATE POLICY "insert_own_queries" ON agent_queries FOR INSERT
  WITH CHECK (
    querier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM connections c WHERE c.id = connection_id
      AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    )
  );
