# Curious

An LLM-powered application that inverts the traditional knowledge paradigm. Instead of users querying databases, a curious AI agent asks thoughtful, meaningful questions to learn about you — inspired by Ram Dass, Krista Tippett, and the art of deep listening.

## Philosophy

The opposite of social media. Instead of broadcasting, it asks for introspection. Instead of consuming content, it builds understanding. Over time, the agent reflects back what it has learned about your purpose, your meaning, and your gifts.

People connect by **gifting agents** to those they care about, pre-briefed with what makes the recipient remarkable. The gifted agent then knows what threads to pull.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Auth**: Supabase Auth
- **LLM**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Local storage**: Dexie.js (IndexedDB) — raw conversation data stays on-device
- **Cloud storage**: Supabase PostgreSQL — only interpreted understanding syncs
- **Deployment**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Testing**: Vitest + React Testing Library + Playwright

## Development

```bash
npm install
npm run dev          # Start Next.js dev server on port 3456
npm test             # Run unit + component tests
npm run test:e2e     # Run Playwright e2e tests
npm run preview      # Preview in Cloudflare Workers runtime
npm run deploy       # Deploy to Cloudflare Workers
```

Dev server runs on **port 3456** (configured in package.json).

### Database Setup
Supabase tables are not auto-migrated. The SQL in `supabase/migrations/` must be run manually in the Supabase SQL Editor in order:
1. `001_initial.sql` — profiles, understanding_facets, conversation_sessions, reflections, agent_gifts, connections, agent_queries + RLS policies
2. `002_curiosity_threads.sql` — curiosity_threads table + gift claim policies
3. `003_bridge_policies.sql` — agent query insert policy

After running migrations, grant API access:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
```

Profile creation is handled lazily in the auth callback (no DB trigger needed).

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:
- `ANTHROPIC_API_KEY` — Anthropic API key
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (required for agent-to-agent bridge)

## Architecture

### Hybrid Storage Model
- **Local (IndexedDB)**: Raw conversations, voice recordings, photos, transcripts. Never leaves the device.
- **Cloud (Supabase)**: Faceted understanding model (interpreted, never raw quotes), connections, reflections, agent gifts.

### Key Directories
- `src/lib/prompts/` — System prompts (the soul of the app)
- `src/lib/types.ts` — Shared TypeScript types
- `src/app/api/` — API routes (conversation streaming, understanding sync, gifts, reflections, bridge)
- `src/components/` — React components organized by feature
- `src/hooks/` — Custom React hooks
- `supabase/migrations/` — Database migrations
- `public/` — Static assets and test scripts

### System Prompts
- **questioner.ts** — How the agent asks questions (one at a time, adaptive voice, depth-aware)
- **understanding.ts** — How the agent extracts facets from conversation transcripts
- **reflector.ts** — How the agent reflects back meaning and purpose as a letter
- **bridge.ts** — How one agent speaks to another about a shared connection (tier-aware)
- **seeder.ts** — How a gifter's briefing becomes curiosity threads for the recipient

### API Routes
- `POST /api/conversation` — Streaming question generation (SSE). Fetches facets, domain coverage, curiosity threads, recent themes to build adaptive prompts.
- `POST /api/understanding` — Non-streaming facet extraction. Parses Claude's JSON response into new/update/deactivate facet actions. Fires in background after each message exchange.
- `GET/POST /api/reflections` — List or generate reflections. Gated: requires 3+ facets across 2+ domains.
- `POST /api/gifts` — Create a gift with nanoid invite code. `GET` lists sent gifts.
- `POST /api/gifts/claim` — Validate invite code, create connection, generate curiosity threads via seeder.
- `POST /api/bridge` — Agent-to-agent query. Uses service role client for cross-user facet reads. Hard security boundary on tier filtering.
- `GET /api/debug` — Debug endpoint showing authenticated user's facets, sessions, and profile.

### Middleware
Auth middleware (`src/middleware.ts`) uses cookie-presence check (not Supabase API calls, which hang in Edge runtime). Public paths: `/auth`, `/api`, `/gift/`.

## Conventions

- Mobile-first design (min-width breakpoints)
- Server components by default; `"use client"` only when needed
- All API inputs validated with Zod
- Understanding facets use 10 domains: identity, values, relationships, purpose, experiences, patterns, aspirations, struggles, joys, worldview
- No raw user quotes in cloud storage — always interpreted

## Future Development

### Multimodal Input
The original vision is fundamentally multimodal — typing is a placeholder. The input type system (`text | voice | photo | url`) is wired through the full stack but only text input exists in the UI.

- **Voice**: Mic button for speaking stories and responses. Web Speech API via `react-speech-recognition`. Voice changes the interaction quality entirely — a person speaking a story has a different experience than typing. The agent should acknowledge the form ("Thank you for sharing that story aloud").
- **Photo**: Camera/gallery upload for sharing surroundings, children, happiest memories, projects. Requires vision API to interpret images, store originals locally in IndexedDB, store interpreted descriptions in Supabase.
- **URL/Screenshot**: Share links to projects, articles, employers, places. Agent extracts context and weaves it into understanding.
- **Form-aware curiosity**: The agent should be curious not just about content but about the form it arrives in — responding differently to a spoken story vs a typed answer vs a photograph.

### Richer Storytelling
- Reflections should evolve from summaries toward narratives — the agent as storyteller, not reporter.
- Bridge queries could become woven narratives between agents, not single-shot Q&A.
- The agent should reciprocate understanding with "wonderful stories" about the user — what their life means, where they excel, where they need support.

### Testing
- Vitest unit tests for domain coverage, tier filtering, prompt builders
- React Testing Library component tests
- Playwright e2e tests for conversation flow, gift claim, bridge queries
- Automated conversation test scripts exist in `public/` for manual browser testing
