import { MODEL, getAnthropicApiKey } from "@/lib/anthropic";
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

  // Determine if this is a reflection turn (every 3rd exchange)
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const isReflectionTurn = userMessageCount > 0 && userMessageCount % 3 === 0;

  const systemPrompt = buildQuestionerPrompt({
    facets,
    curiosityThreads,
    recentMessages: messages,
    domainCoverage,
    recentThemes,
    conversationCount,
    isReflectionTurn,
  });

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 500 });
  }

  // Use direct fetch to Anthropic API — the SDK's stream iterator
  // doesn't work in Cloudflare Workers
  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: isReflectionTurn ? 500 : 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
      stream: true,
    }),
  });

  if (!anthropicResponse.ok || !anthropicResponse.body) {
    const errText = await anthropicResponse.text().catch(() => "unknown");
    console.error("[anthropic error]", anthropicResponse.status, errText);
    return Response.json({ error: "LLM request failed" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const anthropicReader = anthropicResponse.body.getReader();

  if (isReflectionTurn) {
    // Buffer the full response to split on ---
    let fullText = "";
    let sseBuffer = "";

    while (true) {
      const { done, value } = await anthropicReader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });

      const lines = sseBuffer.split("\n");
      sseBuffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              fullText += evt.delta.text;
            }
          } catch {
            // skip
          }
        }
      }
    }

    // Split on --- delimiter (flexible matching)
    const delimiterMatch = fullText.match(/\n\s*---+\s*\n/);
    const responseEvents: string[] = [];

    if (delimiterMatch && delimiterMatch.index !== undefined) {
      const reflection = fullText.slice(0, delimiterMatch.index).trim();
      const question = fullText.slice(delimiterMatch.index + delimiterMatch[0].length).trim();
      responseEvents.push(`data: ${JSON.stringify({ type: "reflection", text: reflection })}\n\n`);
      responseEvents.push(`data: ${JSON.stringify({ type: "question", text: question })}\n\n`);
    } else {
      responseEvents.push(`data: ${JSON.stringify({ type: "question", text: fullText.trim() })}\n\n`);
    }
    responseEvents.push("data: [DONE]\n\n");

    return new Response(responseEvents.join(""), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-reflection turn: stream through
  const readable = new ReadableStream({
    async start(controller) {
      let sseBuffer = "";
      try {
        while (true) {
          const { done, value } = await anthropicReader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });

          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const evt = JSON.parse(line.slice(6));
                if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "question", text: evt.delta.text })}\n\n`
                    )
                  );
                }
              } catch {
                // skip malformed JSON
              }
            }
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
