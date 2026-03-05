import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated", user: null });
  }

  // Try every possible way to access env vars in Cloudflare Workers
  const envDiag: Record<string, unknown> = {
    processEnv: !!process.env.ANTHROPIC_API_KEY,
  };

  // Try getCloudflareContext (sync)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const env = ctx?.env as Record<string, unknown>;
    envDiag.cfContextKeys = Object.keys(env ?? {});
    envDiag.cfKeyType = typeof env?.ANTHROPIC_API_KEY;
    envDiag.cfKeyConstructor = env?.ANTHROPIC_API_KEY?.constructor?.name;
    envDiag.cfKeyStringified = env?.ANTHROPIC_API_KEY ? String(env.ANTHROPIC_API_KEY).slice(0, 10) + "..." : "EMPTY";
    envDiag.cfHasKey = !!(env?.ANTHROPIC_API_KEY);
  } catch (e) {
    envDiag.cfContextError = String(e);
  }

  // Try getCloudflareContext (async)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    envDiag.cfAsyncKeys = Object.keys(ctx?.env ?? {});
    envDiag.cfAsyncHasKey = !!(ctx?.env as Record<string, unknown>)?.ANTHROPIC_API_KEY;
  } catch (e) {
    envDiag.cfAsyncError = String(e);
  }

  // Try globalThis
  try {
    const g = globalThis as Record<string, unknown>;
    envDiag.globalThisKeys = Object.keys(g).filter(k =>
      k.includes("ANTHROPIC") || k.includes("SUPABASE") || k.includes("env")
    ).slice(0, 20);
  } catch (e) {
    envDiag.globalThisError = String(e);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return Response.json({
    user: { id: user.id, email: user.email },
    envDiag,
    profile: { data: profile },
  });
}
