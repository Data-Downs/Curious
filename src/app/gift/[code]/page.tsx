"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GiftClaimCard } from "@/components/gift/gift-claim-card";
import { createClient } from "@/lib/supabase/client";

export default function GiftClaimPage() {
  const params = useParams();
  const code = params.code as string;
  const [gift, setGift] = useState<{
    relationship_label: string;
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchGift() {
      const supabase = createClient();
      const { data } = await supabase
        .from("agent_gifts")
        .select("relationship_label, status")
        .eq("invite_code", code)
        .single();

      if (!data) {
        setNotFound(true);
      } else {
        setGift(data);
      }
      setLoading(false);
    }
    fetchGift();
  }, [code]);

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

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-curious-50 px-4">
        <p className="text-lg font-serif text-curious-600">
          This gift wasn&apos;t found, or has already been claimed.
        </p>
      </div>
    );
  }

  if (gift?.status === "accepted") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-curious-50 px-4">
        <p className="text-lg font-serif text-curious-600">
          This gift has already been accepted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-curious-50 px-4">
      <div className="max-w-md w-full">
        <GiftClaimCard
          inviteCode={code}
          relationshipLabel={gift?.relationship_label ?? "someone special"}
        />
      </div>
    </div>
  );
}
