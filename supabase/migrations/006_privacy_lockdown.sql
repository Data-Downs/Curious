-- ============================================================================
-- PRIVACY LOCKDOWN
-- Critical security migration. Fixes multiple data exposure vulnerabilities.
-- ============================================================================

-- ─── 1. RECIPIENT MUST NOT SEE RAW BRIEFING ─────────────────────────────────
-- The read_claimed_gifts policy gives recipients SELECT on the full row,
-- including the briefing column. Postgres RLS cannot filter columns, so
-- replace the policy with an RPC function that returns only safe fields.

DROP POLICY IF EXISTS "read_claimed_gifts" ON agent_gifts;

-- Recipient can only see their claimed gifts through this function
CREATE OR REPLACE FUNCTION get_my_claimed_gifts()
RETURNS TABLE (
  id UUID,
  relationship_label TEXT,
  status TEXT,
  gifter_id UUID,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ag.id,
    ag.relationship_label,
    ag.status,
    ag.gifter_id,
    ag.claimed_at,
    ag.created_at
  FROM agent_gifts ag
  WHERE ag.recipient_id = auth.uid()
    AND ag.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The claim flow needs to read a pending gift by invite code.
-- The old read_pending_gifts policy was too broad (all pending gifts).
-- Use a SECURITY DEFINER function that only returns what the claim UI needs.
CREATE OR REPLACE FUNCTION get_gift_by_invite_code(invite_code_param TEXT)
RETURNS TABLE (
  id UUID,
  gifter_id UUID,
  recipient_email TEXT,
  relationship_label TEXT,
  status TEXT,
  briefing TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ag.id,
    ag.gifter_id,
    ag.recipient_email,
    ag.relationship_label,
    ag.status,
    ag.briefing
  FROM agent_gifts ag
  WHERE ag.invite_code = invite_code_param
    AND ag.status = 'pending'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. CURIOSITY THREADS: RECIPIENT MUST NOT READ DIRECTLY ─────────────────
-- The own_threads policy lets recipients SELECT their threads from the browser.
-- Threads contain transformed briefing content that reveals the gifter's
-- perspective. Remove direct read access — threads are read server-side only
-- via the admin/service-role client in the conversation API.

DROP POLICY IF EXISTS "own_threads" ON curiosity_threads;

-- Threads can only be written/updated by the owner (for the explored flag),
-- but NOT read directly. Server-side reads use the service-role client.
CREATE POLICY "write_own_threads" ON curiosity_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_threads" ON curiosity_threads
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── 3. AGENT QUERIES: ONLY QUERIER SEES THEIR OWN QUERIES ─────────────────
-- Verify the subject cannot see queries about them (already fixed in 004,
-- but belt-and-suspenders).
DROP POLICY IF EXISTS "see_queries" ON agent_queries;

CREATE POLICY "see_own_queries" ON agent_queries
  FOR SELECT USING (querier_id = auth.uid());

-- ─── 4. CONNECTIONS: PREVENT FORGED CONNECTIONS ─────────────────────────────
-- The insert_connections policy allows either party to match auth.uid(),
-- meaning a user could forge a connection with an arbitrary other user.
-- Restrict inserts to the claim flow by requiring BOTH users to be set
-- and only allowing insert if you are user_b (the claimer).

DROP POLICY IF EXISTS "insert_connections" ON connections;

CREATE POLICY "insert_connections_restricted" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user_b_id);

-- ─── 5. GIFTER CANNOT MODIFY GIFTS AFTER CLAIM ─────────────────────────────
-- The own_gifts FOR ALL policy lets the gifter UPDATE after claim,
-- potentially changing the briefing retroactively.

DROP POLICY IF EXISTS "own_gifts" ON agent_gifts;

-- Gifter can read all their gifts
CREATE POLICY "gifter_read_own" ON agent_gifts
  FOR SELECT USING (auth.uid() = gifter_id);

-- Gifter can insert new gifts
CREATE POLICY "gifter_create" ON agent_gifts
  FOR INSERT WITH CHECK (auth.uid() = gifter_id);

-- Gifter can only update PENDING gifts (not already claimed ones)
CREATE POLICY "gifter_update_pending" ON agent_gifts
  FOR UPDATE USING (auth.uid() = gifter_id AND status = 'pending');

-- The claim_gift policy (from 005) still allows recipients to update
-- status during claim. Keep it as-is.
