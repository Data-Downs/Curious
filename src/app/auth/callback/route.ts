import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAnthropicRaw } from "@/lib/anthropic";
import { buildSeederPrompt } from "@/lib/prompts/seeder";
import { z } from "zod";

const seederResponseSchema = z.object({
  threads: z.array(
    z.object({
      domain: z.string(),
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
  const { data: gift } = await supabase
    .from("agent_gifts")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "pending")
    .single();

  if (!gift || gift.gifter_id === userId) return;

  // Update gift status
  await supabase
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
