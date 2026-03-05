"use client";

import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";
import { PERSONA_LIST, TEST_GIFTS, PERSONA_IDS } from "@/lib/test-personas";
import type { TestPersona } from "@/lib/test-personas";

const TEST_PASSWORD = "curious-test-2024";
const PERSONA_KEY = "curious-persona-mode";

export function getActivePersonaKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PERSONA_KEY);
}

export function getActivePersona(): TestPersona | null {
  const key = getActivePersonaKey();
  if (!key) return null;
  const id = PERSONA_IDS[key as keyof typeof PERSONA_IDS];
  return PERSONA_LIST.find((p) => p.id === id) || null;
}

export async function playAsPersona(personaKey: string): Promise<{ success: boolean; error?: string }> {
  const id = PERSONA_IDS[personaKey as keyof typeof PERSONA_IDS];
  const persona = PERSONA_LIST.find((p) => p.id === id);
  if (!persona) return { success: false, error: "Unknown persona" };

  const supabase = createClient();

  // Sign out current user first
  await supabase.auth.signOut();

  // Sign in as this persona
  const { error } = await supabase.auth.signInWithPassword({
    email: persona.email,
    password: TEST_PASSWORD,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Mark persona mode
  localStorage.setItem(PERSONA_KEY, personaKey);

  // Seed IndexedDB with this persona's conversation data
  await seedLocalData(persona);

  return { success: true };
}

export async function exitPersonaMode(): Promise<void> {
  localStorage.removeItem(PERSONA_KEY);
  const supabase = createClient();
  await supabase.auth.signOut();
  // Clear test data from IndexedDB
  await db.messages.clear();
  await db.conversations.clear();
  await db.curiosityThreads.clear();
}

async function seedLocalData(persona: TestPersona): Promise<void> {
  // Clear existing local data
  await db.messages.clear();
  await db.conversations.clear();
  await db.curiosityThreads.clear();
  await db.media.clear();

  // Seed conversations and messages
  for (let i = 0; i < persona.conversations.length; i++) {
    const conv = persona.conversations[i];
    const convId = `test-conv-${persona.id.slice(-4)}-${i}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (persona.conversations.length - i) * 3);

    await db.conversations.put({
      id: convId,
      startedAt: startDate,
      lastMessageAt: new Date(startDate.getTime() + 20 * 60000),
      messageCount: conv.messages.length,
    });

    for (let j = 0; j < conv.messages.length; j++) {
      const msg = conv.messages[j];
      const msgTime = new Date(startDate.getTime() + j * 60000);
      await db.messages.put({
        id: `test-msg-${persona.id.slice(-4)}-${i}-${j}`,
        conversationId: convId,
        role: msg.role,
        content: msg.content,
        inputType: "text",
        timestamp: msgTime,
      });
    }
  }

  // Seed curiosity threads from gifts received by this persona
  const receivedGifts = TEST_GIFTS.filter((g) => g.toPersonaId === persona.id);
  for (const gift of receivedGifts) {
    for (let k = 0; k < gift.curiosityThreads.length; k++) {
      const thread = gift.curiosityThreads[k];
      await db.curiosityThreads.put({
        id: `test-thread-${gift.id.slice(-4)}-${k}`,
        domain: thread.domain,
        thread: thread.thread,
        explored: false,
        sourceGiftId: gift.id,
        createdAt: new Date(),
      });
    }
  }
}
