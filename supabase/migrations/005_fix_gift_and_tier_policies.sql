-- SECURITY FIX 1: Restrict read_pending_gifts policy
-- Previously any authenticated user could read ALL pending gifts, exposing
-- briefings (deeply personal content), recipient emails, and invite codes.
-- Now only expose relationship_label and status via an RPC function, and
-- restrict direct table access.

DROP POLICY IF EXISTS "read_pending_gifts" ON agent_gifts;

-- Replace with a narrow policy: you can only read a pending gift if you
-- know the invite code (checked in application code via the claim API).
-- No blanket SELECT on all pending gifts.
-- The gift claim page now uses an API route instead of direct client queries.

-- Allow recipients to read gifts they've already claimed (for connections page)
CREATE POLICY "read_claimed_gifts" ON agent_gifts FOR SELECT
  USING (recipient_id = auth.uid());

-- RPC function for the gift claim page: returns only what the UI needs
-- given an invite code. No browsing of all gifts possible.
CREATE OR REPLACE FUNCTION get_gift_preview(invite_code_param TEXT)
RETURNS TABLE (relationship_label TEXT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ag.relationship_label, ag.status
  FROM agent_gifts ag
  WHERE ag.invite_code = invite_code_param
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY FIX 2: Prevent tier escalation on connections
-- Previously either user could update ANY column on the connection,
-- including the other user's tier (escalating their own access).
-- Replace with a function that only allows updating your own tier.

DROP POLICY IF EXISTS "update_own_tier" ON connections;

-- No direct UPDATE policy — force all tier changes through this function
CREATE OR REPLACE FUNCTION update_my_tier(
  connection_id_param UUID,
  new_tier TEXT
) RETURNS VOID AS $$
DECLARE
  conn RECORD;
BEGIN
  -- Validate tier value
  IF new_tier NOT IN ('surface', 'personal', 'deep') THEN
    RAISE EXCEPTION 'Invalid tier value';
  END IF;

  -- Fetch the connection
  SELECT * INTO conn FROM connections c WHERE c.id = connection_id_param;

  IF conn IS NULL THEN
    RAISE EXCEPTION 'Connection not found';
  END IF;

  -- Only update YOUR OWN tier field
  IF conn.user_a_id = auth.uid() THEN
    UPDATE connections SET tier_a_to_b = new_tier WHERE id = connection_id_param;
  ELSIF conn.user_b_id = auth.uid() THEN
    UPDATE connections SET tier_b_to_a = new_tier WHERE id = connection_id_param;
  ELSE
    RAISE EXCEPTION 'Not your connection';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
