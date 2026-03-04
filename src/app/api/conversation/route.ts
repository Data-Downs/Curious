import { getAnthropicClient, MODEL } from "@/lib/anthropic";
import { buildQuestionerPrompt } from "@/lib/prompts/questioner";
import { conversationRequestSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { suggestExplorationPriority } from "@/lib/domain-coverage";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const parsed = conversationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, inputType, mediaDescription, recentMessages } = parsed.data;

  // Fetch understanding facets, recent sessions, profile, and curiosity threads in parallel
  const [facetsResult, sessionsResult, profileResult, threadsResult] =
    await Promise.all([
      supabase
        .from("understanding_facets")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("confidence", { ascending: false }),
      supabase
        .from("conversation_sessions")
        .select("themes")
        .eq("user_id", user.id)
        .order("ended_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("total_conversations")
        .eq("id", user.id)
        .single(),
      supabase
        .from("curiosity_threads")
        .select("thread")
        .eq("user_id", user.id)
        .eq("explored", false)
        .limit(5),
    ]);

  const facets = facetsResult.data ?? [];

  // Compute domain coverage
  const domainCoverage = suggestExplorationPriority(facets);

  // Gather recent themes from last 5 sessions
  const recentThemes = (sessionsResult.data ?? [])
    .flatMap((s) => s.themes ?? [])
    .slice(0, 10);

  const conversationCount = profileResult.data?.total_conversations ?? 0;

  // Gather unexplored curiosity threads
  const curiosityThreads = (threadsResult.data ?? []).map((t) => t.thread);

  // Build conversation context
  const messages: { role: string; content: string }[] = recentMessages ?? [];

  let userContent = message;
  if (inputType === "voice") {
    userContent = `[Voice message, transcribed]: ${message}`;
  } else if (inputType === "photo" && mediaDescription) {
    userContent = `[Shared a photo]: ${mediaDescription}\n${message}`;
  } else if (inputType === "url") {
    userContent = `[Shared a link]: ${message}`;
  }
  messages.push({ role: "user", content: userContent });

  const systemPrompt = buildQuestionerPrompt({
    facets,
    curiosityThreads,
    recentMessages: messages,
    domainCoverage,
    recentThemes,
    conversationCount,
  });

  const anthropic = getAnthropicClient();
  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("[conversation stream error]", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
