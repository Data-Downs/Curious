"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { BridgeQuery } from "@/components/connections/bridge-query";
import { TierControl } from "@/components/connections/tier-control";

interface ConnectionDetail {
  id: string;
  otherName: string;
  relationshipLabel: string;
  myTier: string;
  theirTier: string;
  tierField: "tier_a_to_b" | "tier_b_to_a";
}

interface PastQuery {
  id: string;
  query_text: string;
  response_text: string;
  tier: string;
  created_at: string;
}

export default function ConnectionDetailPage() {
  const params = useParams();
  const connectionId = params.id as string;
  const { user } = useAuth();
  const [detail, setDetail] = useState<ConnectionDetail | null>(null);
  const [pastQueries, setPastQueries] = useState<PastQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchDetail() {
      const supabase = createClient();

      const { data: conn } = await supabase
        .from("connections")
        .select("*")
        .eq("id", connectionId)
        .single();

      if (!conn) {
        setLoading(false);
        return;
      }

      const isUserA = conn.user_a_id === user!.id;
      const otherId = isUserA ? conn.user_b_id : conn.user_a_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", otherId)
        .single();

      let relationshipLabel = "Connection";
      if (conn.gift_id) {
        const { data: gift } = await supabase
          .from("agent_gifts")
          .select("relationship_label")
          .eq("id", conn.gift_id)
          .single();
        if (gift) relationshipLabel = gift.relationship_label;
      }

      setDetail({
        id: conn.id,
        otherName: profile?.display_name || "Someone",
        relationshipLabel,
        myTier: isUserA ? conn.tier_a_to_b : conn.tier_b_to_a,
        theirTier: isUserA ? conn.tier_b_to_a : conn.tier_a_to_b,
        tierField: isUserA ? "tier_a_to_b" : "tier_b_to_a",
      });

      // Fetch past queries
      const { data: queries } = await supabase
        .from("agent_queries")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: false })
        .limit(10);

      setPastQueries(queries ?? []);
      setLoading(false);
    }

    fetchDetail();
  }, [user, connectionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-curious-50">
        <div className="flex gap-2">
          <span className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe" />
          <span
            className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe"
            style={{ animationDelay: "0.4s" }}
          />
          <span
            className="block w-1.5 h-1.5 rounded-full bg-curious-400 animate-breathe"
            style={{ animationDelay: "0.8s" }}
          />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-curious-50 px-4">
        <p className="text-lg font-serif text-curious-600">
          Connection not found.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-curious-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-serif text-curious-900">
            {detail.otherName}
          </h1>
          <p className="text-sm text-curious-500">{detail.relationshipLabel}</p>
        </header>

        <TierControl
          connectionId={detail.id}
          currentTier={detail.myTier}
          tierField={detail.tierField}
          onTierChanged={(newTier) =>
            setDetail((d) => (d ? { ...d, myTier: newTier } : d))
          }
        />

        <div className="space-y-2">
          <p className="text-xs text-curious-500 uppercase tracking-wide">
            Ask their agent
          </p>
          <p className="text-xs text-curious-400">
            Access level: {detail.theirTier}
          </p>
          <BridgeQuery connectionId={detail.id} />
        </div>

        {pastQueries.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-curious-500 uppercase tracking-wide">
              Past conversations
            </p>
            {pastQueries.map((q) => (
              <div
                key={q.id}
                className="bg-white/40 rounded-xl px-5 py-4 space-y-2"
              >
                <p className="text-sm text-curious-600 font-medium">
                  {q.query_text}
                </p>
                <p className="text-sm font-serif text-curious-700 leading-relaxed whitespace-pre-line">
                  {q.response_text}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-curious-400">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-curious-400 bg-curious-100/60 rounded-full px-2 py-0.5">
                    {q.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
