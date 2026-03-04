import { getAnthropicClient, MODEL } from "@/lib/anthropic";
import { buildQuestionerPrompt } from "@/lib/prompts/questioner";
import { conversationRequestSchema } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Validate input
  const body = await request.json();
  const parsed = conversationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, inputType, mediaDescription, recentMessages } = parsed.data;

  // Fetch user's understanding facets from Supabase
  const { data: facets } = await supabase
    .from("understanding_facets")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("confidence", { ascending: false });

  // Build conversation context for the prompt
  const messages: { role: string; content: string }[] = recentMessages ?? [];

  // Add the current message
  let userContent = message;
  if (inputType === "voice") {
    userContent = `[Voice message, transcribed]: ${message}`;
  } else if (inputType === "photo" && mediaDescription) {
    userContent = `[Shared a photo]: ${mediaDescription}\n${message}`;
  } else if (inputType === "url") {
    userContent = `[Shared a link]: ${message}`;
  }
  messages.push({ role: "user", content: userContent });

  // Build the system prompt
  const systemPrompt = buildQuestionerPrompt({
    facets: facets ?? [],
    recentMessages: messages,
  });

  // Stream response from Claude
  const anthropic = getAnthropicClient();
  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  // Convert to SSE stream
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
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
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
