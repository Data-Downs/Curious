import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: connectionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch the connection — RLS ensures user can only see their own
  const { data: conn, error } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (error || !conn) {
    return Response.json({ error: "Connection not found" }, { status: 404 });
  }

  // Verify the authenticated user is a party to this connection
  if (conn.user_a_id !== user.id && conn.user_b_id !== user.id) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const isUserA = conn.user_a_id === user.id;
  const otherId = isUserA ? conn.user_b_id : conn.user_a_id;

  const admin = getAdminClient();

  // Use admin client to read the other user's profile (bypasses RLS)
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", otherId)
    .single() as { data: { display_name: string } | null };

  let relationshipLabel = "Connection";
  if (conn.gift_id) {
    const { data: gift } = await admin
      .from("agent_gifts")
      .select("relationship_label")
      .eq("id", conn.gift_id)
      .single() as { data: { relationship_label: string } | null };
    if (gift) relationshipLabel = gift.relationship_label;
  }

  return Response.json({
    id: conn.id,
    displayName: profile?.display_name || "Someone",
    relationshipLabel,
    myTier: isUserA ? conn.tier_a_to_b : conn.tier_b_to_a,
    theirTier: isUserA ? conn.tier_b_to_a : conn.tier_a_to_b,
    tierField: isUserA ? "tier_a_to_b" : "tier_b_to_a",
  });
}
