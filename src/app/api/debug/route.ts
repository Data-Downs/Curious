import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated", user: null });
  }

  const { data: facets, error: facetsError } = await supabase
    .from("understanding_facets")
    .select("*")
    .eq("user_id", user.id);

  const { data: sessions, error: sessionsError } = await supabase
    .from("conversation_sessions")
    .select("*")
    .eq("user_id", user.id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return Response.json({
    user: { id: user.id, email: user.email },
    facets: { data: facets, error: facetsError?.message },
    sessions: { data: sessions, error: sessionsError?.message },
    profile: { data: profile, error: profileError?.message },
  });
}
