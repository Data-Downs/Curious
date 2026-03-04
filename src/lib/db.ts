"use client";

import Dexie, { type EntityTable } from "dexie";
import type {
  LocalConversation,
  LocalMessage,
  LocalMediaItem,
  CuriosityThread,
} from "@/lib/types";

class CuriousDB extends Dexie {
  conversations!: EntityTable<LocalConversation, "id">;
  messages!: EntityTable<LocalMessage, "id">;
  media!: EntityTable<LocalMediaItem, "id">;
  curiosityThreads!: EntityTable<CuriosityThread, "id">;

  constructor() {
    super("curious");
    this.version(1).stores({
      conversations: "id, startedAt, lastMessageAt",
      messages: "id, conversationId, timestamp",
      media: "id, messageId, createdAt",
      curiosityThreads: "id, domain, sourceGiftId",
    });
  }
}

export const db = new CuriousDB();
