import { createClient } from "@/lib/supabase/server";
import { giftRequestSchema } from "@/lib/types";
import { nanoid } from "nanoid";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: gifts } = await supabase
    .from("agent_gifts")
    .select("id, recipient_email, relationship_label, status, invite_code, created_at, claimed_at")
    .eq("gifter_id", user.id)
    .order("created_at", { ascending: false });

  return Response.json({ gifts: gifts ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const parsed = giftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recipientEmail, briefing, relationshipLabel } = parsed.data;

  const inviteCode = nanoid(12);

  const { data: gift, error } = await supabase
    .from("agent_gifts")
    .insert({
      gifter_id: user.id,
      recipient_email: recipientEmail,
      briefing,
      relationship_label: relationshipLabel,
      invite_code: inviteCode,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "Failed to create gift" }, { status: 500 });
  }

  return Response.json({ gift, inviteUrl: `/gift/${inviteCode}` });
}
