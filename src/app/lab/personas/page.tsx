"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PERSONA_LIST,
  TEST_GIFTS,
  TEST_CONNECTIONS,
  PERSONA_IDS,
  type TestPersona,
  type TestGift,
  type TestConnection,
} from "@/lib/test-personas";
import { playAsPersona } from "@/lib/persona-mode";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "conversation" | "understanding" | "connections" | "reflection";

interface PersonaPanelState {
  personaKey: string | null;
  activeTab: TabId;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  identity: "#e07a5f",
  values: "#81b29a",
  relationships: "#f2cc8f",
  purpose: "#3d405b",
  experiences: "#a8dadc",
  patterns: "#e9c46a",
  aspirations: "#264653",
  struggles: "#bc6c5b",
  joys: "#f4a261",
  worldview: "#606c38",
};

const PERSONA_KEYS = Object.keys(PERSONA_IDS) as (keyof typeof PERSONA_IDS)[];

function getPersonaByKey(key: string): TestPersona | undefined {
  return PERSONA_LIST.find(
    (p) => p.id === PERSONA_IDS[key as keyof typeof PERSONA_IDS]
  );
}

function getPersonaByIdFn(id: string): TestPersona | undefined {
  return PERSONA_LIST.find((p) => p.id === id);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PersonasDashboard() {
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [playingAs, setPlayingAs] = useState<string | null>(null);
  const router = useRouter();

  const [panels, setPanels] = useState<[PersonaPanelState, PersonaPanelState]>([
    { personaKey: "elena", activeTab: "conversation" },
    { personaKey: "marcus", activeTab: "understanding" },
  ]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      const res = await fetch("/api/seed-personas", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSeeded(true);
      } else {
        setSeedError(data.error || "Unknown error");
      }
    } catch (e) {
      setSeedError(String(e));
    } finally {
      setSeeding(false);
    }
  }, []);

  const handlePlay = useCallback(async (key: string) => {
    setPlayingAs(key);
    const result = await playAsPersona(key);
    if (result.success) {
      router.push("/conversation");
    } else {
      setSeedError(`Sign-in failed for ${key}: ${result.error}. Did you seed first?`);
      setPlayingAs(null);
    }
  }, [router]);

  const updatePanel = (
    index: 0 | 1,
    update: Partial<PersonaPanelState>
  ) => {
    setPanels((prev) => {
      const next = [...prev] as [PersonaPanelState, PersonaPanelState];
      next[index] = { ...next[index], ...update };
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-curious-950 text-curious-100">
      {/* Header */}
      <header className="border-b border-curious-800 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif text-curious-100">
              Persona Lab
            </h1>
            <p className="text-xs text-curious-500 mt-0.5">
              Five connected test personas for exploring the Curious experience
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 text-xs font-medium rounded-md bg-curious-700 text-curious-100 hover:bg-curious-600 disabled:opacity-50 transition-colors"
          >
            {seeding ? "Seeding..." : seeded ? "Re-seed Supabase" : "Seed Supabase"}
          </button>
        </div>
        {seedError && (
          <p className="text-xs text-red-400 mt-2 max-w-[1800px] mx-auto">
            {seedError}
          </p>
        )}
        {seeded && !seedError && (
          <p className="text-xs text-green-400 mt-2 max-w-[1800px] mx-auto">
            Test data seeded successfully.
          </p>
        )}
      </header>

      {/* Connection Graph */}
      <div className="border-b border-curious-800 px-6 py-5">
        <div className="max-w-[1800px] mx-auto">
          <ConnectionGraph
            onSelectPersona={(key) => updatePanel(0, { personaKey: key })}
            onPlayAs={handlePlay}
            playingAs={playingAs}
            selectedKeys={[panels[0].personaKey, panels[1].personaKey]}
          />
        </div>
      </div>

      {/* Side-by-side Panels */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-px bg-curious-800">
        <PersonaPanel
          state={panels[0]}
          panelIndex={0}
          onUpdate={(u) => updatePanel(0, u)}
        />
        <PersonaPanel
          state={panels[1]}
          panelIndex={1}
          onUpdate={(u) => updatePanel(1, u)}
        />
      </div>
    </div>
  );
}

// ─── Connection Graph ─────────────────────────────────────────────────────────

function ConnectionGraph({
  onSelectPersona,
  onPlayAs,
  playingAs,
  selectedKeys,
}: {
  onSelectPersona: (key: string) => void;
  onPlayAs: (key: string) => void;
  playingAs: string | null;
  selectedKeys: (string | null)[];
}) {
  const gifts = TEST_GIFTS;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Top row: Elena */}
      <div className="flex justify-center">
        <PersonaNode
          personaKey="elena"
          isSelected={selectedKeys.includes("elena")}
          onClick={() => onSelectPersona("elena")}
          onPlayAs={() => onPlayAs("elena")}
          playingAs={playingAs}
        />
      </div>

      {/* Gift lines from Elena */}
      <div className="flex items-start gap-2 text-curious-600 text-[10px] font-mono">
        <span>gifted</span>
      </div>

      {/* Middle row: Marcus, Priya, Leo */}
      <div className="flex justify-center gap-8 sm:gap-16">
        <PersonaNode
          personaKey="marcus"
          isSelected={selectedKeys.includes("marcus")}
          onClick={() => onSelectPersona("marcus")}
          onPlayAs={() => onPlayAs("marcus")}
          playingAs={playingAs}
          label={getGiftLabel(gifts, PERSONA_IDS.elena, PERSONA_IDS.marcus)}
        />
        <PersonaNode
          personaKey="priya"
          isSelected={selectedKeys.includes("priya")}
          onClick={() => onSelectPersona("priya")}
          onPlayAs={() => onPlayAs("priya")}
          playingAs={playingAs}
          label={getGiftLabel(gifts, PERSONA_IDS.elena, PERSONA_IDS.priya)}
        />
        <PersonaNode
          personaKey="leo"
          isSelected={selectedKeys.includes("leo")}
          onClick={() => onSelectPersona("leo")}
          onPlayAs={() => onPlayAs("leo")}
          playingAs={playingAs}
          label={getGiftLabel(gifts, PERSONA_IDS.elena, PERSONA_IDS.leo)}
        />
      </div>

      {/* Gift line from Leo */}
      <div className="flex items-start gap-2 text-curious-600 text-[10px] font-mono ml-auto mr-[15%] sm:mr-[20%]">
        <span>gifted</span>
      </div>

      {/* Bottom row: Jade */}
      <div className="flex justify-end pr-[10%] sm:pr-[15%] w-full">
        <PersonaNode
          personaKey="jade"
          isSelected={selectedKeys.includes("jade")}
          onClick={() => onSelectPersona("jade")}
          onPlayAs={() => onPlayAs("jade")}
          playingAs={playingAs}
          label={getGiftLabel(gifts, PERSONA_IDS.leo, PERSONA_IDS.jade)}
        />
      </div>
    </div>
  );
}

function getGiftLabel(
  gifts: TestGift[],
  fromId: string,
  toId: string
): string {
  const gift = gifts.find(
    (g) => g.fromPersonaId === fromId && g.toPersonaId === toId
  );
  return gift?.relationshipLabel || "";
}

function PersonaNode({
  personaKey,
  isSelected,
  onClick,
  onPlayAs,
  playingAs,
  label,
}: {
  personaKey: string;
  isSelected: boolean;
  onClick: () => void;
  onPlayAs: () => void;
  playingAs: string | null;
  label?: string;
}) {
  const persona = getPersonaByKey(personaKey);
  if (!persona) return null;

  const engagementWidth = Math.min(
    100,
    (persona.totalConversations / 15) * 100
  );
  const isLoading = playingAs === personaKey;

  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
        isSelected
          ? "bg-curious-800 ring-1 ring-curious-500"
          : "hover:bg-curious-900"
      }`}
    >
      <button onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif text-white"
          style={{ backgroundColor: persona.color }}
        >
          {persona.displayName[0]}
        </div>
        <span className="text-xs font-medium text-curious-200">
          {persona.displayName}
        </span>
        {label && (
          <span className="text-[10px] text-curious-500 italic">{label}</span>
        )}
        {/* Engagement bar */}
        <div className="w-16 h-1 bg-curious-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${engagementWidth}%`,
              backgroundColor: persona.color,
            }}
          />
        </div>
        <span className="text-[9px] text-curious-600">
          {persona.totalConversations} conversations
        </span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onPlayAs(); }}
        disabled={!!playingAs}
        className="mt-1 px-3 py-1 text-[10px] font-medium rounded-md bg-curious-700 text-curious-200 hover:bg-curious-600 disabled:opacity-40 transition-colors"
      >
        {isLoading ? "Signing in..." : "Play as"}
      </button>
    </div>
  );
}

// ─── Persona Panel ────────────────────────────────────────────────────────────

function PersonaPanel({
  state,
  panelIndex,
  onUpdate,
}: {
  state: PersonaPanelState;
  panelIndex: 0 | 1;
  onUpdate: (u: Partial<PersonaPanelState>) => void;
}) {
  const persona = state.personaKey
    ? getPersonaByKey(state.personaKey)
    : undefined;

  if (!persona) {
    return (
      <div className="bg-curious-950 p-8 flex items-center justify-center min-h-[600px]">
        <p className="text-curious-600 text-sm font-serif italic">
          Select a persona from the graph above
        </p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "conversation", label: "Conversations" },
    { id: "understanding", label: "Understanding" },
    { id: "connections", label: "Connections" },
    { id: "reflection", label: "Reflections" },
  ];

  return (
    <div className="bg-curious-950 min-h-[600px] flex flex-col">
      {/* Persona header */}
      <div className="px-5 py-4 border-b border-curious-800 flex items-center gap-4">
        {/* Persona selector */}
        <select
          value={state.personaKey || ""}
          onChange={(e) => onUpdate({ personaKey: e.target.value })}
          className="bg-curious-900 text-curious-200 text-sm rounded-md px-3 py-1.5 border border-curious-700 font-serif"
        >
          {PERSONA_KEYS.map((key) => {
            const p = getPersonaByKey(key);
            return (
              <option key={key} value={key}>
                {p?.displayName} ({p?.age})
              </option>
            );
          })}
        </select>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-curious-400 truncate">{persona.bio}</p>
        </div>

        <span className="text-[10px] text-curious-600 whitespace-nowrap">
          Panel {panelIndex + 1}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-curious-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onUpdate({ activeTab: tab.id })}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              state.activeTab === tab.id
                ? "text-curious-200 border-b-2 border-curious-400"
                : "text-curious-600 hover:text-curious-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        {state.activeTab === "conversation" && (
          <ConversationTab persona={persona} />
        )}
        {state.activeTab === "understanding" && (
          <UnderstandingTab persona={persona} />
        )}
        {state.activeTab === "connections" && (
          <ConnectionsTab persona={persona} />
        )}
        {state.activeTab === "reflection" && (
          <ReflectionTab persona={persona} />
        )}
      </div>
    </div>
  );
}

// ─── Conversation Tab ─────────────────────────────────────────────────────────

function ConversationTab({ persona }: { persona: TestPersona }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-curious-600 uppercase tracking-wider">
          {persona.conversations.length} sessions shown of{" "}
          {persona.totalConversations} total
        </span>
      </div>

      {persona.conversations.map((conv, i) => (
        <div key={i} className="rounded-lg border border-curious-800 overflow-hidden">
          <button
            onClick={() =>
              setExpandedIndex(expandedIndex === i ? null : i)
            }
            className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-curious-900 transition-colors"
          >
            <span className="text-[10px] text-curious-600 mt-0.5 shrink-0">
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-curious-300 leading-relaxed">
                {conv.sessionSummary}
              </p>
              <div className="flex gap-1.5 mt-1.5">
                {conv.themes.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-curious-900 text-curious-500"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-curious-600 text-xs">
              {expandedIndex === i ? "−" : "+"}
            </span>
          </button>

          {expandedIndex === i && (
            <div className="px-4 pb-4 space-y-3 border-t border-curious-800/50 pt-3">
              {conv.messages.map((msg, j) => (
                <div
                  key={j}
                  className={`text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "font-serif text-curious-400 italic"
                      : "text-curious-200 pl-4 border-l-2 border-curious-700"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Understanding Tab ────────────────────────────────────────────────────────

function UnderstandingTab({ persona }: { persona: TestPersona }) {
  // Group facets by domain
  const byDomain: Record<string, typeof persona.facets> = {};
  for (const f of persona.facets) {
    if (!byDomain[f.domain]) byDomain[f.domain] = [];
    byDomain[f.domain].push(f);
  }

  const domains = Object.keys(byDomain).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-curious-600 uppercase tracking-wider">
          {persona.facets.length} facets across {domains.length} domains
        </span>
      </div>

      {/* Domain coverage visualization */}
      <div className="flex gap-1 mb-6">
        {[
          "identity",
          "values",
          "relationships",
          "purpose",
          "experiences",
          "patterns",
          "aspirations",
          "struggles",
          "joys",
          "worldview",
        ].map((domain) => {
          const count = byDomain[domain]?.length || 0;
          const maxDepth = byDomain[domain]
            ? Math.max(...byDomain[domain].map((f) => f.depth))
            : 0;
          return (
            <div key={domain} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${Math.max(4, count * 12)}px`,
                  backgroundColor: count > 0 ? DOMAIN_COLORS[domain] : "#2c211c",
                  opacity: count > 0 ? 0.6 + maxDepth * 0.08 : 0.2,
                }}
              />
              <span className="text-[8px] text-curious-600 truncate w-full text-center">
                {domain.slice(0, 4)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Facets by domain */}
      {domains.map((domain) => (
        <div key={domain} className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: DOMAIN_COLORS[domain] }}
            />
            <h3 className="text-xs font-medium text-curious-300 capitalize">
              {domain}
            </h3>
            <span className="text-[10px] text-curious-600">
              ({byDomain[domain].length})
            </span>
          </div>
          {byDomain[domain].map((facet, i) => (
            <div
              key={i}
              className="pl-4 border-l border-curious-800 py-1.5"
            >
              <p className="text-xs text-curious-300 leading-relaxed">
                {facet.content}
              </p>
              <div className="flex gap-3 mt-1">
                <span className="text-[9px] text-curious-600">
                  confidence: {facet.confidence}
                </span>
                <span className="text-[9px] text-curious-600">
                  depth: {facet.depth}/5
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          d < facet.depth
                            ? DOMAIN_COLORS[domain]
                            : "#2c211c",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Connections Tab ──────────────────────────────────────────────────────────

function ConnectionsTab({ persona }: { persona: TestPersona }) {
  const connections = TEST_CONNECTIONS.filter(
    (c) => c.userAId === persona.id || c.userBId === persona.id
  );

  const giftsGiven = TEST_GIFTS.filter(
    (g) => g.fromPersonaId === persona.id
  );
  const giftsReceived = TEST_GIFTS.filter(
    (g) => g.toPersonaId === persona.id
  );

  return (
    <div className="space-y-6">
      {/* Gifts given */}
      {giftsGiven.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-curious-400 uppercase tracking-wider mb-3">
            Gifts Given ({giftsGiven.length})
          </h3>
          {giftsGiven.map((gift) => {
            const recipient = getPersonaByIdFn(gift.toPersonaId);
            const conn = connections.find((c) => c.giftId === gift.id);
            return (
              <GiftCard
                key={gift.id}
                gift={gift}
                otherName={recipient?.displayName || "Unknown"}
                direction="given"
                connection={conn}
                personaId={persona.id}
              />
            );
          })}
        </div>
      )}

      {/* Gifts received */}
      {giftsReceived.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-curious-400 uppercase tracking-wider mb-3">
            Gifts Received ({giftsReceived.length})
          </h3>
          {giftsReceived.map((gift) => {
            const gifter = getPersonaByIdFn(gift.fromPersonaId);
            const conn = connections.find((c) => c.giftId === gift.id);
            return (
              <GiftCard
                key={gift.id}
                gift={gift}
                otherName={gifter?.displayName || "Unknown"}
                direction="received"
                connection={conn}
                personaId={persona.id}
              />
            );
          })}
        </div>
      )}

      {connections.length === 0 && (
        <p className="text-xs text-curious-600 italic font-serif text-center py-8">
          No connections yet.
        </p>
      )}
    </div>
  );
}

function GiftCard({
  gift,
  otherName,
  direction,
  connection,
  personaId,
}: {
  gift: TestGift;
  otherName: string;
  direction: "given" | "received";
  connection?: TestConnection;
  personaId: string;
}) {
  const [showBriefing, setShowBriefing] = useState(false);
  const [showThreads, setShowThreads] = useState(false);

  const myTier = connection
    ? personaId === connection.userAId
      ? connection.tierAtoB
      : connection.tierBtoA
    : null;
  const theirTier = connection
    ? personaId === connection.userAId
      ? connection.tierBtoA
      : connection.tierAtoB
    : null;

  return (
    <div className="rounded-lg border border-curious-800 p-4 mb-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-curious-200 font-serif">
            {otherName}
          </span>
          <span className="text-xs text-curious-500 ml-2">
            {gift.relationshipLabel}
          </span>
        </div>
        <span className="text-[9px] text-curious-600 font-mono">
          {gift.inviteCode}
        </span>
      </div>

      {/* Tier visualization */}
      {connection && (
        <div className="flex gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-curious-500">
              {direction === "given" ? "You share" : "They share"}:
            </span>
            <TierBadge tier={myTier!} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-curious-500">
              {direction === "given" ? "They share" : "You share"}:
            </span>
            <TierBadge tier={theirTier!} />
          </div>
        </div>
      )}

      {/* Briefing toggle */}
      <button
        onClick={() => setShowBriefing(!showBriefing)}
        className="text-[10px] text-curious-500 hover:text-curious-300 transition-colors"
      >
        {showBriefing ? "Hide briefing" : "Show briefing"}
      </button>
      {showBriefing && (
        <p className="text-xs text-curious-400 leading-relaxed pl-3 border-l border-curious-700 italic">
          {gift.briefing}
        </p>
      )}

      {/* Curiosity threads */}
      {gift.curiosityThreads.length > 0 && direction === "received" && (
        <>
          <button
            onClick={() => setShowThreads(!showThreads)}
            className="text-[10px] text-curious-500 hover:text-curious-300 transition-colors"
          >
            {showThreads
              ? "Hide curiosity threads"
              : `Show ${gift.curiosityThreads.length} curiosity threads`}
          </button>
          {showThreads && (
            <div className="space-y-2">
              {gift.curiosityThreads.map((t, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-start text-xs"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      backgroundColor:
                        DOMAIN_COLORS[t.domain] || "#666",
                    }}
                  />
                  <span className="text-curious-400">{t.thread}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    surface: "bg-curious-700 text-curious-400",
    personal: "bg-curious-600 text-curious-200",
    deep: "bg-curious-500 text-curious-100",
  };
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
        colors[tier] || colors.surface
      }`}
    >
      {tier}
    </span>
  );
}

// ─── Reflection Tab ───────────────────────────────────────────────────────────

function ReflectionTab({ persona }: { persona: TestPersona }) {
  if (persona.reflections.length === 0) {
    const facetCount = persona.facets.length;
    const domainCount = new Set(persona.facets.map((f) => f.domain)).size;
    const eligible = facetCount >= 3 && domainCount >= 2;

    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-xs text-curious-600 italic font-serif">
          No reflections yet.
        </p>
        <p className="text-[10px] text-curious-700">
          {eligible
            ? `${persona.displayName} has ${facetCount} facets across ${domainCount} domains — eligible for reflection.`
            : `Needs 3+ facets across 2+ domains. Currently: ${facetCount} facets, ${domainCount} domains.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {persona.reflections.map((ref, i) => (
        <div key={i} className="space-y-3">
          <h3 className="font-serif text-sm text-curious-200">{ref.title}</h3>
          <div className="flex gap-1.5 mb-2">
            {ref.domains.map((d) => (
              <span
                key={d}
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: DOMAIN_COLORS[d] + "22",
                  color: DOMAIN_COLORS[d],
                }}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="text-xs text-curious-300 leading-relaxed whitespace-pre-line font-serif">
            {ref.content}
          </div>
        </div>
      ))}
    </div>
  );
}
