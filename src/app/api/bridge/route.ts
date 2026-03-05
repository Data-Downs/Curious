import { getAnthropicClient, MODEL } from "@/lib/anthropic";
import { buildBridgePrompt } from "@/lib/prompts/bridge";
import { filterFacetsByTier } from "@/lib/tier-filter";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { giftQueryRequestSchema, type UnderstandingFacet } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = giftQueryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { connectionId, query } = parsed.data;

  // Fetch connection and verify access
  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!connection) {
    return Response.json({ error: "Connection not found" }, { status: 404 });
  }

  // Determine who is querying and who is being queried
  const isUserA = connection.user_a_id === user.id;
  const isUserB = connection.user_b_id === user.id;

  if (!isUserA && !isUserB) {
    return Response.json({ error: "Not your connection" }, { status: 403 });
  }

  // The tier that the *subject* has granted to the *querier*
  const tier = isUserA
    ? (connection.tier_b_to_a as "surface" | "personal" | "deep")
    : (connection.tier_a_to_b as "surface" | "personal" | "deep");

  const subjectId = isUserA ? connection.user_b_id : connection.user_a_id;

  // Use admin client to read the subject's facets (cross-user read)
  const admin = getAdminClient();
  const { data: subjectFacets } = await admin
    .from("understanding_facets")
    .select("*")
    .eq("user_id", subjectId)
    .eq("is_active", true) as { data: UnderstandingFacet[] | null };

  // Hard security boundary: filter by tier
  const filteredFacets = filterFacetsByTier(subjectFacets ?? [], tier);

  // Get subject's profile name
  const { data: subjectProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", subjectId)
    .single() as { data: { display_name: string } | null };

  // Get relationship label from the gift
  const { data: gift } = connection.gift_id
    ? (await admin
        .from("agent_gifts")
        .select("relationship_label")
        .eq("id", connection.gift_id)
        .single() as { data: { relationship_label: string } | null })
    : { data: null };

  const subjectName = subjectProfile?.display_name || "this person";
  const relationshipLabel = gift?.relationship_label || "connection";

  const systemPrompt = buildBridgePrompt({
    queryText: query,
    subjectName,
    relationshipLabel,
    tier,
    filteredFacets,
  });

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: query }],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Log the query
  await supabase.from("agent_queries").insert({
    connection_id: connectionId,
    query_text: query,
    response_text: responseText,
    tier,
  });

  return Response.json({ response: responseText, tier });
}
