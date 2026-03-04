import { getAnthropicClient, MODEL } from "@/lib/anthropic";
import { buildUnderstandingPrompt } from "@/lib/prompts/understanding";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const understandingRequestSchema = z.object({
  conversationId: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["agent", "user"]),
      content: z.string(),
    })
  ),
  startedAt: z.string(),
});

const facetActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("new"),
    domain: z.string(),
    content: z.string(),
    confidence: z.number(),
    depth: z.number(),
  }),
  z.object({
    action: z.literal("update"),
    existing_facet_id: z.string(),
    domain: z.string(),
    content: z.string(),
    confidence: z.number(),
    depth: z.number(),
  }),
  z.object({
    action: z.literal("deactivate"),
    existing_facet_id: z.string(),
  }),
]);

const extractionSchema = z.object({
  facets: z.array(facetActionSchema),
  session_summary: z.string(),
  themes: z.array(z.string()),
  agent_notes: z.string(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const parsed = understandingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { conversationId, messages, startedAt } = parsed.data;

  // Fetch existing active facets
  const { data: existingFacets } = await supabase
    .from("understanding_facets")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Build prompt and call Claude (non-streaming — need complete JSON)
  const systemPrompt = buildUnderstandingPrompt({
    transcript: messages,
    existingFacets: existingFacets ?? [],
  });

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content:
          "Analyze this conversation and extract understanding. Respond with JSON only.",
      },
    ],
  });

  // Parse the response
  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  let extraction;
  try {
    // Try to parse JSON — handle markdown code fences if present
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    extraction = extractionSchema.parse(JSON.parse(jsonStr));
  } catch (err) {
    console.error("[understanding parse error]", err, responseText);
    return Response.json(
      { error: "Failed to parse understanding extraction" },
      { status: 500 }
    );
  }

  // Apply facet changes
  const facetErrors: string[] = [];
  for (const facet of extraction.facets) {
    if (facet.action === "new") {
      const { error } = await supabase.from("understanding_facets").insert({
        user_id: user.id,
        domain: facet.domain,
        content: facet.content,
        confidence: facet.confidence,
        depth: facet.depth,
        is_active: true,
      });
      if (error) {
        console.error("[understanding] facet insert error:", error.message, error.details, error.hint);
        facetErrors.push(`insert: ${error.message}`);
      }
    } else if (facet.action === "update") {
      const { error } = await supabase
        .from("understanding_facets")
        .update({
          content: facet.content,
          confidence: facet.confidence,
          depth: facet.depth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", facet.existing_facet_id)
        .eq("user_id", user.id);
      if (error) {
        console.error("[understanding] facet update error:", error.message);
        facetErrors.push(`update: ${error.message}`);
      }
    } else if (facet.action === "deactivate") {
      const { error } = await supabase
        .from("understanding_facets")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", facet.existing_facet_id)
        .eq("user_id", user.id);
      if (error) {
        console.error("[understanding] facet deactivate error:", error.message);
        facetErrors.push(`deactivate: ${error.message}`);
      }
    }
  }

  if (facetErrors.length > 0) {
    console.error("[understanding] facet errors:", facetErrors);
  }

  // Write conversation session metadata
  const { error: sessionError } = await supabase.from("conversation_sessions").insert({
    user_id: user.id,
    session_summary: extraction.session_summary,
    themes: extraction.themes,
    agent_notes: extraction.agent_notes,
    message_count: messages.length,
    started_at: startedAt,
    ended_at: new Date().toISOString(),
  });
  if (sessionError) {
    console.error("[understanding] session insert error:", sessionError.message, sessionError.details, sessionError.hint);
  }

  // Update profile stats
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_conversations")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({
      total_conversations: (profile?.total_conversations ?? 0) + 1,
      last_conversation_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Mark curiosity threads as explored if conversation touched their domains
  const touchedDomains = new Set(
    extraction.facets
      .filter((f) => f.action === "new" || f.action === "update")
      .map((f) => f.domain)
  );

  if (touchedDomains.size > 0) {
    const { data: threads } = await supabase
      .from("curiosity_threads")
      .select("id, domain")
      .eq("user_id", user.id)
      .eq("explored", false);

    if (threads) {
      for (const thread of threads) {
        if (touchedDomains.has(thread.domain)) {
          await supabase
            .from("curiosity_threads")
            .update({ explored: true })
            .eq("id", thread.id);
        }
      }
    }
  }

  return Response.json({
    success: true,
    facetsProcessed: extraction.facets.length,
    sessionSummary: extraction.session_summary,
    themes: extraction.themes,
  });
}
