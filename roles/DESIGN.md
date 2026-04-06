# DESIGN_v1.md — Dating Texting Assistant

## Overview

Web app that accepts screenshot/text input of dating app conversations and returns
structured reply suggestions with strategic framing. Subscription product at ~$35/mo.
Texting-support only — no headshot pipeline in this phase.

---

## Product Scope (Phase 1)

**Core loop:**
1. User pastes screenshot or text of a conversation
2. App returns 3 reply options ranked by engagement likelihood
3. Each option includes a brief strategic rationale
4. User copies preferred reply

**Secondary features:**
- Conversation history persisted per match (for voice/context continuity)
- Style profile built from user's past chosen replies
- Profile review: paste your bio, get rewrite suggestions

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js (App Router) | API routes eliminate separate backend for this phase |
| Styling | Tailwind CSS | Speed |
| Auth | Clerk | Free to 10K MAU, OAuth out of the box |
| Database | SQLite via Prisma | Zero ops, file-based, sufficient for MVP scale |
| LLM | Anthropic SDK direct | No proxy needed; Claude only |
| Payments | Lemon Squeezy | Handles VAT, simpler than Stripe for solo |
| Hosting | Cloud Run (GCP) | Pay-per-use, no cold-start pain at low traffic |
| Email | Resend | Free to 3K/mo, transactional only |
| Storage | None (Phase 1) | Screenshots processed in-memory, not persisted |

No separate FastAPI service. No Redis. No Celery. No GCS.
All LLM calls are synchronous within Next.js API routes (~2-5s, well within Cloud Run timeout).

---

## Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (app)/
│   │   ├── dashboard/          # match list
│   │   ├── match/[id]/         # conversation view + reply generator
│   │   └── profile/            # bio reviewer
│   └── api/
│       ├── suggest/            # POST: generate reply suggestions
│       ├── matches/            # GET/POST: match CRUD
│       ├── conversations/      # GET/POST: message history per match
│       └── webhooks/
│           └── lemon-squeezy/  # subscription lifecycle events
├── components/
│   ├── ConversationInput.tsx   # paste text or screenshot upload
│   ├── SuggestionCard.tsx      # reply option with rationale
│   ├── MatchList.tsx
│   └── ProfileReviewer.tsx
├── lib/
│   ├── anthropic.ts            # SDK client + prompt templates
│   ├── db.ts                   # Prisma client singleton
│   └── subscription.ts        # entitlement checks
├── prisma/
│   └── schema.prisma
├── middleware.ts               # Clerk auth guard
├── flake.nix                   # nix dev shell
├── flake.lock
└── docker-compose.yml          # container smoke testing
```

---

## Data Model

```prisma
model User {
  id             String    @id                    // Clerk user ID
  email          String    @unique
  subscriptionId String?
  plan           Plan      @default(FREE)
  styleProfile   String?                          // JSON blob, updated from chosen replies
  matches        Match[]
  createdAt      DateTime  @default(now())
}

model Match {
  id            String         @id @default(cuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id])
  name          String
  platform      String?        // hinge, bumble, tinder, etc
  notes         String?
  messages      Message[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Message {
  id          String   @id @default(cuid())
  matchId     String
  match       Match    @relation(fields: [matchId], references: [id])
  role        Role                              // USER or THEM
  content     String
  chosen      Boolean  @default(false)          // was this a chosen suggestion?
  createdAt   DateTime @default(now())
}

enum Role {
  USER
  THEM
}

enum Plan {
  FREE
  PRO
}
```

---

## Core API: `/api/suggest`

**Request:**
```typescript
{
  matchId: string
  input: string           // pasted conversation text
  imageBase64?: string    // screenshot, optional
}
```

**Handler logic:**
1. Verify Clerk session
2. Check `user.plan === PRO` (gate behind subscription)
3. Fetch last N messages for this match (conversation context)
4. Fetch `user.styleProfile` if exists
5. Call Claude with composed prompt (see below)
6. Return structured suggestions

**Response:**
```typescript
{
  suggestions: [
    {
      reply: string
      rationale: string
      tone: "playful" | "direct" | "warm"
    }
  ]
}
```

---

## Prompt Design

System prompt (stored in `lib/anthropic.ts`):

```
You are a dating coach helping craft replies on dating apps.
Your suggestions should feel natural, not AI-generated.

User's communication style:
{styleProfile or "unknown, infer from conversation"}

Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    { "reply": string, "rationale": string, "tone": string }
  ]
}
No preamble, no markdown, no explanation outside the JSON.
```

User turn:
```
Conversation so far:
{last 10 messages formatted as THEM/ME alternating}

New message from them:
{input}

Suggest 3 replies ranked by likely engagement.
```

Image handling: if `imageBase64` provided, pass as vision content block
alongside the text prompt. Claude extracts the conversation natively.

**Style profile update:** After user selects a reply, a background call
sends the chosen text to a lightweight prompt that extracts style signals
and merges them into `user.styleProfile`. Non-blocking.

---

## Auth & Subscription Gates

Clerk middleware protects all `/app/*` and `/api/*` routes except webhooks.

Entitlement logic in `lib/subscription.ts`:

```typescript
export function canGenerate(user: User): boolean {
  return user.plan === 'PRO'
}
```

Free tier: dashboard access, 3 lifetime suggestions (to validate the UX
before asking for payment). Pro tier: unlimited.

Lemon Squeezy webhook events to handle:
- `subscription_created` → set `plan = PRO`, store `subscriptionId`
- `subscription_cancelled` / `subscription_expired` → set `plan = FREE`

---

## Local Dev

Three layers, distinct purposes, none conflicting:

| Layer | File | Purpose |
|---|---|---|
| Nix dev shell | `flake.nix` | Daily driver — reproducible tooling on coco |
| Docker Compose | `docker-compose.yml` | Container smoke test before pushing |
| Dockerfile | `Dockerfile` | Cloud Run deployment artifact |

The flake never touches Cloud Run. Cloud Run never knows about Nix.

### flake.nix

Primary dev environment. `nix develop` drops into a shell with the exact
Node version, Prisma engines, and supporting tools — no implicit system
dependencies, reproducible across machines.

```nix
{
  description = "Dating texting assistant dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system}; in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_20
            nodePackages.npm
            prisma-engines
            openssl
            docker-compose  # for container testing layer
          ];

          env = {
            # Prisma looks for engines via this; nix provides them
            PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1";
            PRISMA_QUERY_ENGINE_LIBRARY =
              "${pkgs.prisma-engines}/lib/libquery_engine.node";
            PRISMA_QUERY_ENGINE_BINARY =
              "${pkgs.prisma-engines}/bin/query-engine";
            PRISMA_SCHEMA_ENGINE_BINARY =
              "${pkgs.prisma-engines}/bin/schema-engine";
          };
        };
      });
}
```

Prisma on NixOS requires the engine path env vars above — the default
behavior of downloading binaries at runtime fails in the Nix sandbox.
These point Prisma at the store paths directly.

Daily workflow:
```bash
direnv + .envrc to automatically enter. Make sure this is enabled if it isn't already.
npm install
cp .env.example .env # fill in keys
npx prisma migrate dev
npm run dev          # Next.js on :3000, hot reload
```

### docker-compose.yml

Used only to verify the container builds and runs correctly before
pushing to Cloud Run. Not the primary dev workflow.

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/data/dev.db
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUB}
      - CLERK_SECRET_KEY=${CLERK_SECRET}
      - LEMONSQUEEZY_WEBHOOK_SECRET=${LS_WEBHOOK_SECRET}
    volumes:
      - ./data:/data
```

Run with `docker compose up` from inside `nix develop` (docker-compose
is included in the shell packages).

### Env vars required

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
LEMONSQUEEZY_WEBHOOK_SECRET    # dummy value fine for dev
DATABASE_URL                   # set automatically by flake env or .env
```

---

## Deployment (Cloud Run)

Single container, built via Cloud Build on push to `main`.

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV DATABASE_URL=file:/data/prod.db
CMD ["npm", "start"]
```

Cloud Run config:
- Min instances: 0 (scale to zero)
- Max instances: 2 (cost cap)
- Memory: 512MB
- Concurrency: 80

SQLite persistence: Cloud Run volume mount at `/data`. Acceptable for
MVP — if the container restarts, data persists. For higher reliability,
migrate to Hetzner Postgres when you have 50+ active users.

Estimated Cloud Run cost at MVP scale: < $2/mo.

---

## Unit Economics (recap)

| | |
|---|---|
| Subscription price | $35/mo |
| Anthropic API per active user | ~$1-3/mo |
| Gross margin | ~92% |
| Total infra at 50 users | ~$6/mo |
| Revenue at 50 users | ~$1,750/mo |

---

## Build Order

1. Scaffold Next.js project, Clerk auth, Prisma + SQLite
2. Match/conversation CRUD (no AI yet)
3. `/api/suggest` with Claude integration, hardcoded system prompt
4. `SuggestionCard` UI, copy-to-clipboard
5. Lemon Squeezy checkout + webhook handler
6. Subscription gate on suggest endpoint
7. Style profile extraction (background, post-selection)
8. Profile bio reviewer (separate prompt, same endpoint pattern)
9. Containerize + Cloud Run deploy
10. Screenshot/vision input path

Steps 1-6 are the shippable core. Steps 7-10 are iteration.
