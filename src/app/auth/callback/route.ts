import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { callAnthropicRaw } from "@/lib/anthropic";
import { buildSeederPrompt } from "@/lib/prompts/seeder";
import { z } from "zod";

const seederResponseSchema = z.object({
  threads: z.array(
    z.object({
      domain: z.string(),
      layer: z.string().default("origin"),
      thread: z.string(),
    })
  ),
});

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/conversation";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure profile exists (lazy creation instead of trigger)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              display_name: user.user_metadata?.display_name ?? "",
            },
            { onConflict: "id", ignoreDuplicates: true }
          );

        // Auto-claim gift if redirecting from a gift claim link
        const giftClaimMatch = next.match(/^\/gift\/([^/]+)\/claim$/);
        if (giftClaimMatch) {
          const inviteCode = giftClaimMatch[1];
          try {
            await claimGift(supabase, user.id, inviteCode);
          } catch (err) {
            console.error("[auto-claim error]", err);
          }
          return NextResponse.redirect(`${origin}/conversation`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}

async function claimGift(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  inviteCode: string
) {
  // Use admin client — the claimer has no SELECT access to pending gifts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getAdminClient() as any;
  const { data: gift } = await admin
    .from("agent_gifts")
    .select("id, gifter_id, recipient_email, relationship_label, status, briefing")
    .eq("invite_code", inviteCode)
    .eq("status", "pending")
    .single() as { data: { id: string; gifter_id: string; recipient_email: string; relationship_label: string; status: string; briefing: string } | null };

  if (!gift || gift.gifter_id === userId) return;

  // Update gift status via admin client
  await admin
    .from("agent_gifts")
    .update({
      recipient_id: userId,
      status: "accepted",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", gift.id);

  // Create connection
  await supabase.from("connections").insert({
    gift_id: gift.id,
    user_a_id: gift.gifter_id,
    user_b_id: userId,
    tier_a_to_b: "personal",
    tier_b_to_a: "surface",
  });

  // Generate curiosity threads
  try {
    const systemPrompt = buildSeederPrompt({
      briefing: gift.briefing,
      relationshipLabel: gift.relationship_label,
    });

    const responseText = await callAnthropicRaw({
      system: systemPrompt,
      userContent:
        "Generate curiosity threads from this briefing. Respond with JSON only.",
      maxTokens: 1500,
    });

    const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const seederResult = seederResponseSchema.parse(JSON.parse(jsonStr));

    for (const thread of seederResult.threads) {
      await supabase.from("curiosity_threads").insert({
        user_id: userId,
        domain: thread.domain,
        layer: thread.layer,
        thread: thread.thread,
        explored: false,
        source_gift_id: gift.id,
      });
    }
  } catch (err) {
    console.error("[seeder error during auto-claim]", err);
    // Gift is still claimed even if thread generation fails
  }
}
