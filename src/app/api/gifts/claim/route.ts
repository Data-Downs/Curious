import { callAnthropicRaw } from "@/lib/anthropic";
import { buildSeederPrompt } from "@/lib/prompts/seeder";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const claimSchema = z.object({
  inviteCode: z.string().min(1),
});

const seederResponseSchema = z.object({
  threads: z.array(
    z.object({
      domain: z.string(),
      layer: z.string().default("origin"),
      thread: z.string(),
    })
  ),
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
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Find the gift
  const { data: gift } = await supabase
    .from("agent_gifts")
    .select("*")
    .eq("invite_code", parsed.data.inviteCode)
    .eq("status", "pending")
    .single();

  if (!gift) {
    return Response.json(
      { error: "Gift not found or already claimed" },
      { status: 404 }
    );
  }

  // Can't claim your own gift
  if (gift.gifter_id === user.id) {
    return Response.json(
      { error: "You can't claim your own gift" },
      { status: 400 }
    );
  }

  // Update gift status
  await supabase
    .from("agent_gifts")
    .update({
      recipient_id: user.id,
      status: "accepted",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", gift.id);

  // Create connection
  await supabase.from("connections").insert({
    gift_id: gift.id,
    user_a_id: gift.gifter_id,
    user_b_id: user.id,
    tier_a_to_b: "personal",
    tier_b_to_a: "surface",
  });

  // Generate curiosity threads from briefing
  try {
    const systemPrompt = buildSeederPrompt({
      briefing: gift.briefing,
      relationshipLabel: gift.relationship_label,
    });

    const responseText = await callAnthropicRaw({
      system: systemPrompt,
      userContent: "Generate curiosity threads from this briefing. Respond with JSON only.",
      maxTokens: 1500,
    });

    const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const seederResult = seederResponseSchema.parse(JSON.parse(jsonStr));

    for (const thread of seederResult.threads) {
      await supabase.from("curiosity_threads").insert({
        user_id: user.id,
        domain: thread.domain,
        layer: thread.layer,
        thread: thread.thread,
        explored: false,
        source_gift_id: gift.id,
      });
    }
  } catch (err) {
    console.error("[seeder error]", err);
    // Gift is still claimed even if thread generation fails
  }

  return Response.json({
    success: true,
    gifterRelationship: gift.relationship_label,
  });
}
