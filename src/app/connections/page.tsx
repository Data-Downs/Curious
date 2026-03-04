"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { ConnectionCard } from "@/components/connections/connection-card";

interface ConnectionWithProfile {
  id: string;
  displayName: string;
  relationshipLabel: string;
  tier: string;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchConnections() {
      const supabase = createClient();

      const { data: rawConnections } = await supabase
        .from("connections")
        .select(
          "id, user_a_id, user_b_id, tier_a_to_b, tier_b_to_a, gift_id"
        )
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`);

      if (!rawConnections || rawConnections.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch related profiles and gifts
      const results: ConnectionWithProfile[] = [];

      for (const conn of rawConnections) {
        const isUserA = conn.user_a_id === user!.id;
        const otherId = isUserA ? conn.user_b_id : conn.user_a_id;
        const theirTierToMe = isUserA
          ? conn.tier_b_to_a
          : conn.tier_a_to_b;

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

        results.push({
          id: conn.id,
          displayName: profile?.display_name || "Someone",
          relationshipLabel,
          tier: theirTierToMe,
        });
      }

      setConnections(results);
      setLoading(false);
    }

    fetchConnections();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-curious-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-2xl font-serif text-curious-900">Connections</h1>
          <p className="text-sm text-curious-500">
            People whose agents you can speak with.
          </p>
        </header>

        {connections.length === 0 && (
          <p className="text-center text-sm text-curious-400 font-serif italic py-12">
            No connections yet. Gift an agent to someone to create a connection.
          </p>
        )}

        <div className="space-y-3">
          {connections.map((c) => (
            <ConnectionCard
              key={c.id}
              id={c.id}
              displayName={c.displayName}
              relationshipLabel={c.relationshipLabel}
              tier={c.tier}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
