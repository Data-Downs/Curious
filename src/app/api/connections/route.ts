import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch connections where user is either party
  const { data: rawConnections, error } = await supabase
    .from("connections")
    .select("id, user_a_id, user_b_id, tier_a_to_b, tier_b_to_a, gift_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!rawConnections || rawConnections.length === 0) {
    return Response.json({ connections: [] });
  }

  const admin = getAdminClient();
  const results = [];

  for (const conn of rawConnections) {
    const isUserA = conn.user_a_id === user.id;
    const otherId = isUserA ? conn.user_b_id : conn.user_a_id;
    const theirTierToMe = isUserA ? conn.tier_b_to_a : conn.tier_a_to_b;

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

    results.push({
      id: conn.id,
      displayName: profile?.display_name || "Someone",
      relationshipLabel,
      tier: theirTierToMe,
      giftId: conn.gift_id,
    });
  }

  return Response.json({ connections: results });
}
