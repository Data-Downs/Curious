import { callAnthropicRaw } from "@/lib/anthropic";
import { buildSeederPrompt } from "@/lib/prompts/seeder";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
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

  // Use admin client — the claimer has no direct SELECT access to
  // agent_gifts (they are neither the gifter nor recipient yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getAdminClient() as any;
  const { data: gift } = await admin
    .from("agent_gifts")
    .select("id, gifter_id, recipient_email, relationship_label, status, briefing")
    .eq("invite_code", parsed.data.inviteCode)
    .eq("status", "pending")
    .single() as { data: { id: string; gifter_id: string; recipient_email: string; relationship_label: string; status: string; briefing: string } | null };

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

  // Update gift status via admin client (claimer doesn't have UPDATE access)
  await (admin as any)
    .from("agent_gifts")
    .update({
      recipient_id: user.id,
      status: "accepted",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", gift.id);

  // Create connection (claimer is user_b, which matches RLS policy)
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
