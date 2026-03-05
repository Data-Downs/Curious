import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  TEST_PERSONAS,
  TEST_GIFTS,
  TEST_CONNECTIONS,
  PERSONA_LIST,
} from "@/lib/test-personas";

// POST /api/seed-personas — Seed all test persona data into Supabase
// Uses service role client to bypass RLS
export async function POST() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getAdminClient() as any;

    // 0. Create auth users for each persona (so we can sign in as them)
    const TEST_PASSWORD = "curious-test-2024";
    const authResults: Record<string, string> = {};
    for (const persona of PERSONA_LIST) {
      // Try to create; if already exists, that's fine
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        id: persona.id,
        email: persona.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: persona.displayName },
      });
      if (authError) {
        if (authError.message?.includes("already been registered")) {
          authResults[persona.displayName] = "exists";
        } else {
          console.error(`Auth error for ${persona.displayName}:`, authError);
          authResults[persona.displayName] = `error: ${authError.message}`;
        }
      } else {
        authResults[persona.displayName] = "created";
      }
    }

    // 1. Create profiles (upsert to allow re-seeding)
    for (const persona of PERSONA_LIST) {
      const { error: profileError } = await admin
        .from("profiles")
        .upsert({
          id: persona.id,
          display_name: persona.displayName,
          voice_style: persona.voiceStyle,
          total_conversations: persona.totalConversations,
          last_conversation_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (profileError) {
        console.error(`Profile error for ${persona.displayName}:`, profileError);
      }
    }

    // 2. Clear existing test facets, sessions, reflections
    for (const persona of PERSONA_LIST) {
      await admin.from("understanding_facets").delete().eq("user_id", persona.id);
      await admin.from("conversation_sessions").delete().eq("user_id", persona.id);
      await admin.from("reflections").delete().eq("user_id", persona.id);
    }

    // 3. Insert facets
    for (const persona of PERSONA_LIST) {
      if (persona.facets.length === 0) continue;
      const facetRows = persona.facets.map((f) => ({
        user_id: persona.id,
        domain: f.domain,
        content: f.content,
        confidence: f.confidence,
        depth: f.depth,
        is_active: true,
      }));
      const { error } = await admin.from("understanding_facets").insert(facetRows);
      if (error) console.error(`Facets error for ${persona.displayName}:`, error);
    }

    // 4. Insert conversation sessions
    for (const persona of PERSONA_LIST) {
      for (let i = 0; i < persona.conversations.length; i++) {
        const conv = persona.conversations[i];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (persona.conversations.length - i) * 3);
        const { error } = await admin.from("conversation_sessions").insert({
          user_id: persona.id,
          session_summary: conv.sessionSummary,
          themes: conv.themes,
          message_count: conv.messages.length,
          started_at: startDate.toISOString(),
          ended_at: new Date(startDate.getTime() + 20 * 60000).toISOString(),
        });
        if (error) console.error(`Session error for ${persona.displayName}:`, error);
      }
    }

    // 5. Insert reflections
    for (const persona of PERSONA_LIST) {
      for (const ref of persona.reflections) {
        const { error } = await admin.from("reflections").insert({
          user_id: persona.id,
          title: ref.title,
          content: ref.content,
          domains: ref.domains,
        });
        if (error) console.error(`Reflection error for ${persona.displayName}:`, error);
      }
    }

    // 6. Clear existing test gifts and connections
    for (const conn of TEST_CONNECTIONS) {
      await admin.from("agent_queries").delete().eq("connection_id", conn.id);
    }
    await admin.from("connections").delete().or(
      PERSONA_LIST.map((p) => `user_a_id.eq.${p.id}`).join(",")
    );
    await admin.from("agent_gifts").delete().or(
      PERSONA_LIST.map((p) => `gifter_id.eq.${p.id}`).join(",")
    );

    // Also clean up curiosity_threads for test personas
    for (const gift of TEST_GIFTS) {
      await admin.from("curiosity_threads").delete().eq("gift_id", gift.id);
    }

    // 7. Insert gifts
    for (const gift of TEST_GIFTS) {
      const { error } = await admin.from("agent_gifts").insert({
        id: gift.id,
        gifter_id: gift.fromPersonaId,
        recipient_email: gift.recipientEmail,
        recipient_id: gift.toPersonaId,
        briefing: gift.briefing,
        relationship_label: gift.relationshipLabel,
        invite_code: gift.inviteCode,
        status: gift.status,
        claimed_at: new Date().toISOString(),
      });
      if (error) console.error(`Gift error:`, error);
    }

    // 8. Insert connections
    for (const conn of TEST_CONNECTIONS) {
      const { error } = await admin.from("connections").insert({
        id: conn.id,
        gift_id: conn.giftId,
        user_a_id: conn.userAId,
        user_b_id: conn.userBId,
        tier_a_to_b: conn.tierAtoB,
        tier_b_to_a: conn.tierBtoA,
      });
      if (error) console.error(`Connection error:`, error);
    }

    // 9. Insert curiosity threads
    for (const gift of TEST_GIFTS) {
      for (const thread of gift.curiosityThreads) {
        const { error } = await admin.from("curiosity_threads").insert({
          user_id: gift.toPersonaId,
          gift_id: gift.id,
          domain: thread.domain,
          thread: thread.thread,
          explored: false,
        });
        if (error) console.error(`Thread error:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      seeded: {
        personas: PERSONA_LIST.map((p) => p.displayName),
        gifts: TEST_GIFTS.length,
        connections: TEST_CONNECTIONS.length,
        totalFacets: PERSONA_LIST.reduce((sum, p) => sum + p.facets.length, 0),
        totalConversations: PERSONA_LIST.reduce((sum, p) => sum + p.conversations.length, 0),
        authUsers: authResults,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed personas", detail: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/seed-personas — Fetch all test persona data for the dashboard
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getAdminClient() as any;
    const personaData: Record<string, unknown> = {};

    for (const persona of PERSONA_LIST) {
      const [facets, sessions, reflections, connections] = await Promise.all([
        admin
          .from("understanding_facets")
          .select("*")
          .eq("user_id", persona.id)
          .eq("is_active", true)
          .order("created_at"),
        admin
          .from("conversation_sessions")
          .select("*")
          .eq("user_id", persona.id)
          .order("started_at"),
        admin
          .from("reflections")
          .select("*")
          .eq("user_id", persona.id)
          .order("created_at"),
        admin
          .from("connections")
          .select("*")
          .or(`user_a_id.eq.${persona.id},user_b_id.eq.${persona.id}`),
      ]);

      personaData[persona.id] = {
        ...persona,
        dbFacets: facets.data || [],
        dbSessions: sessions.data || [],
        dbReflections: reflections.data || [],
        dbConnections: connections.data || [],
      };
    }

    // Also fetch gifts and curiosity threads
    const gifts = await admin
      .from("agent_gifts")
      .select("*")
      .or(PERSONA_LIST.map((p) => `gifter_id.eq.${p.id}`).join(","));

    const threads = await admin
      .from("curiosity_threads")
      .select("*")
      .or(PERSONA_LIST.map((p) => `user_id.eq.${p.id}`).join(","));

    return NextResponse.json({
      personas: personaData,
      gifts: gifts.data || [],
      threads: threads.data || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch persona data", detail: String(error) },
      { status: 500 }
    );
  }
}
