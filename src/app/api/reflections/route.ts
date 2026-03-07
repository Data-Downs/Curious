import { getAnthropicClient, MODEL } from "@/lib/anthropic";
import { buildReflectorPrompt } from "@/lib/prompts/reflector";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reflectionResponseSchema = z.object({
  title: z.string(),
  content: z.string(),
  domains: z.array(z.string()),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: reflections } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return Response.json({ reflections: reflections ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch active facets
  const { data: facets } = await supabase
    .from("understanding_facets")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!facets || facets.length < 3) {
    return Response.json(
      {
        error:
          "Not enough understanding yet. Have a few more conversations first.",
      },
      { status: 400 }
    );
  }

  // Check domain coverage — need at least 2 domains
  const domains = new Set(facets.map((f) => f.domain));
  if (domains.size < 2) {
    return Response.json(
      {
        error:
          "Need understanding across more areas. Keep exploring in conversations.",
      },
      { status: 400 }
    );
  }

  // Fetch previous reflections
  const { data: previousReflections } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const systemPrompt = buildReflectorPrompt({
    facets,
    previousReflections: previousReflections ?? [],
  });

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: "Reflect back what you understand about this person. Respond with JSON only.",
      },
    ],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  let reflection;
  try {
    // Strip markdown code fences if present
    let jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
    // Extract JSON object if there's preamble text before it
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    reflection = reflectionResponseSchema.parse(JSON.parse(jsonStr));
  } catch (err) {
    console.error("[reflection parse error]", err, "Raw response:", responseText);
    return Response.json(
      { error: "Failed to generate reflection" },
      { status: 500 }
    );
  }

  // Save reflection
  const { data: saved, error: saveError } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      title: reflection.title,
      content: reflection.content,
      domains: reflection.domains,
    })
    .select()
    .single();

  if (saveError) {
    return Response.json({ error: "Failed to save reflection" }, { status: 500 });
  }

  return Response.json({ reflection: saved });
}
