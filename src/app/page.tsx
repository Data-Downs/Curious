import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

const domains = [
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
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/conversation");
  }

  return (
    <div className="min-h-screen bg-curious-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        {/* Hero + Login */}
        <section className="pt-16 pb-12 md:pt-24 md:pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-curious-900 mb-4">
            Curious
          </h1>
          <p className="text-lg md:text-xl font-serif text-curious-600 italic leading-relaxed mb-10">
            An agent that wants to understand you.
          </p>
          <div className="flex justify-center">
            <LoginForm />
          </div>
        </section>

        <div className="flex justify-center pb-8">
          <div className="w-12 h-px bg-curious-300" />
        </div>

        <div className="space-y-10 md:space-y-14">
          {/* Philosophy */}
          <section className="animate-fade-in-up">
            <div className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-5">
              <h2 className="text-xl md:text-2xl font-serif text-curious-900">
                The opposite of social media
              </h2>
              <div className="space-y-4 font-serif text-curious-700 leading-relaxed">
                <p>
                  Most technology asks you to broadcast. To perform. To scroll
                  and consume. Curious inverts that entirely.
                </p>
                <p>
                  Instead of broadcasting, it asks for introspection. Instead of
                  consuming content, it builds understanding. Instead of
                  collecting your data, it helps you collect yourself.
                </p>
                <p>
                  Inspired by the deep listeners — Ram Dass, Krista Tippett, and
                  the ancient art of asking questions that actually matter —
                  Curious is an AI agent that sits with you, asks thoughtful
                  questions, and over time learns who you really are.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-6">
              <h2 className="text-xl md:text-2xl font-serif text-curious-900">
                How it works
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-curious-100 flex items-center justify-center">
                    <span className="text-sm font-serif text-curious-600">
                      1
                    </span>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <p className="font-serif text-curious-800 font-medium">
                      One question at a time
                    </p>
                    <p className="text-sm font-serif text-curious-600 leading-relaxed">
                      The agent asks a single, thoughtful question — never
                      rushing, never interrogating. It adapts its voice and depth
                      as it gets to know you.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-curious-100 flex items-center justify-center">
                    <span className="text-sm font-serif text-curious-600">
                      2
                    </span>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <p className="font-serif text-curious-800 font-medium">
                      You respond in your own way
                    </p>
                    <p className="text-sm font-serif text-curious-600 leading-relaxed">
                      Type, speak, share a photo, send a link. However you want
                      to share a piece of yourself, the agent meets you there.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-curious-100 flex items-center justify-center">
                    <span className="text-sm font-serif text-curious-600">
                      3
                    </span>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <p className="font-serif text-curious-800 font-medium">
                      Understanding grows
                    </p>
                    <p className="text-sm font-serif text-curious-600 leading-relaxed">
                      Over time, the agent builds a rich, faceted understanding
                      of who you are — across ten domains of your life.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-12">
                  {domains.map((domain) => (
                    <span
                      key={domain}
                      className="text-xs text-curious-500 bg-curious-100/60 rounded-full px-3 py-1 capitalize"
                    >
                      {domain}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-curious-100 flex items-center justify-center">
                    <span className="text-sm font-serif text-curious-600">
                      4
                    </span>
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <p className="font-serif text-curious-800 font-medium">
                      Reflections
                    </p>
                    <p className="text-sm font-serif text-curious-600 leading-relaxed">
                      The agent writes you letters — reflections on who you are,
                      what matters to you, where your gifts lie. Not summaries.
                      Stories about what your life means.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Gifting */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-5">
              <h2 className="text-xl md:text-2xl font-serif text-curious-900">
                Gift a curious presence
              </h2>
              <div className="space-y-4 font-serif text-curious-700 leading-relaxed">
                <p>
                  The social heart of Curious isn&apos;t a feed or a follower
                  count. It&apos;s a gift.
                </p>
                <p>
                  You can gift a Curious agent to someone you care about —
                  pre-briefed with what makes them remarkable. You tell the agent
                  about their kindness, their quiet brilliance, the things
                  they&apos;d never say about themselves. When the agent meets
                  them, it already knows what threads to pull.
                </p>
                <p className="text-sm text-curious-500 italic">
                  Imagine receiving an agent that already knows you&apos;re
                  extraordinary — and wants to understand exactly how.
                </p>
              </div>
            </div>
          </section>

          {/* Bridge */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-5">
              <h2 className="text-xl md:text-2xl font-serif text-curious-900">
                Agents that talk to each other
              </h2>
              <div className="space-y-4 font-serif text-curious-700 leading-relaxed">
                <p>
                  When two people are connected through Curious, their agents can
                  speak to one another — sharing understanding across a bridge of
                  trust.
                </p>
                <p>
                  Privacy is structural, not a setting. The bridge operates
                  through three tiers — surface, personal, and deep — and each
                  agent only shares what its tier permits. Understanding flows
                  between people who care about each other, but never beyond what
                  each person has revealed.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <div className="flex-1 rounded-xl bg-curious-100/60 px-4 py-3 text-center">
                  <p className="text-xs text-curious-400 uppercase tracking-wide mb-1">
                    Surface
                  </p>
                  <p className="text-xs font-serif text-curious-600">
                    Interests &amp; background
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-curious-100/60 px-4 py-3 text-center">
                  <p className="text-xs text-curious-400 uppercase tracking-wide mb-1">
                    Personal
                  </p>
                  <p className="text-xs font-serif text-curious-600">
                    Values &amp; aspirations
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-curious-100/60 px-4 py-3 text-center">
                  <p className="text-xs text-curious-400 uppercase tracking-wide mb-1">
                    Deep
                  </p>
                  <p className="text-xs font-serif text-curious-600">
                    Purpose &amp; meaning
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-5">
              <h2 className="text-xl md:text-2xl font-serif text-curious-900">
                Your words stay yours
              </h2>
              <div className="space-y-4 font-serif text-curious-700 leading-relaxed">
                <p>
                  Raw conversations never leave your device. They live in local
                  storage on your phone or computer, and nowhere else.
                </p>
                <p>
                  What syncs to the cloud is interpreted understanding —
                  facets the agent has extracted about who you are, never your
                  actual words. No raw quotes. No transcripts. No training data.
                </p>
                <p>
                  The architecture is designed so that even if the cloud were
                  compromised, no one could read what you actually said. Only
                  what your agent understood about you.
                </p>
              </div>
            </div>
          </section>

          {/* Vision */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="bg-white/60 rounded-2xl px-6 py-8 md:px-8 md:py-10 space-y-5">
              <h2 className="text-xl md:text-2xl font-serif text-curious-900">
                Where this is going
              </h2>
              <div className="space-y-4 font-serif text-curious-700 leading-relaxed">
                <p>
                  Typing is just the beginning. The vision for Curious is
                  fundamentally multimodal.
                </p>
                <p>
                  Speak a story aloud and the agent hears the difference in how
                  you tell it. Share a photo of your workshop and it understands
                  what you build. Send a link to something that moved you and it
                  weaves it into your portrait.
                </p>
                <p>
                  The agent should be curious not just about what you share, but
                  about <em>how</em> you share it. A spoken memory carries
                  different weight than a typed one. A photograph reveals what
                  words might not. Form-aware curiosity — meeting people in
                  whatever language feels most natural to them.
                </p>
              </div>
            </div>
          </section>

          {/* Built With */}
          <section
            className="animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="text-center space-y-4 py-6">
              <p className="text-xs tracking-[0.2em] uppercase text-curious-400">
                Built with
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <span className="text-sm font-serif text-curious-500">
                  Next.js
                </span>
                <span className="text-curious-300">&middot;</span>
                <span className="text-sm font-serif text-curious-500">
                  Anthropic Claude
                </span>
                <span className="text-curious-300">&middot;</span>
                <span className="text-sm font-serif text-curious-500">
                  Supabase
                </span>
                <span className="text-curious-300">&middot;</span>
                <span className="text-sm font-serif text-curious-500">
                  Tailwind CSS
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
