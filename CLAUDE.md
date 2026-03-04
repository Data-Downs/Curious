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
- **Voice**: Web Speech API via `react-speech-recognition`
- **Deployment**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Testing**: Vitest + React Testing Library + Playwright

## Development

```bash
npm install
npm run dev          # Start Next.js dev server
npm test             # Run unit + component tests
npm run test:e2e     # Run Playwright e2e tests
npm run preview      # Preview in Cloudflare Workers runtime
npm run deploy       # Deploy to Cloudflare Workers
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:
- `ANTHROPIC_API_KEY` — Anthropic API key
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

## Architecture

### Hybrid Storage Model
- **Local (IndexedDB)**: Raw conversations, voice recordings, photos, transcripts. Never leaves the device.
- **Cloud (Supabase)**: Faceted understanding model (interpreted, never raw quotes), connections, reflections, agent gifts.

### Key Directories
- `src/lib/prompts/` — System prompts (the soul of the app)
- `src/lib/types.ts` — Shared TypeScript types
- `src/app/api/` — API routes (conversation streaming, understanding sync, gifts, reflections)
- `src/components/` — React components organized by feature
- `src/hooks/` — Custom React hooks
- `supabase/migrations/` — Database migrations

### System Prompts
- **questioner.ts** — How the agent asks questions (one at a time, adaptive voice)
- **understanding.ts** — How the agent updates its model of you after each conversation
- **reflector.ts** — How the agent reflects back meaning and purpose
- **bridge.ts** — How one agent speaks to another (agent-to-agent)
- **seeder.ts** — How a gifter's briefing becomes curiosity threads

## Conventions

- Mobile-first design (min-width breakpoints)
- Server components by default; `"use client"` only when needed
- All API inputs validated with Zod
- Understanding facets use 10 domains: identity, values, relationships, purpose, experiences, patterns, aspirations, struggles, joys, worldview
- No raw user quotes in cloud storage — always interpreted
