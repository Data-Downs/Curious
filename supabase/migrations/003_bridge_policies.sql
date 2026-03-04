-- Allow users to insert agent queries for their own connections
CREATE POLICY "insert_own_queries" ON agent_queries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM connections c WHERE c.id = connection_id
    AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
  ));
