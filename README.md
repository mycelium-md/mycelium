# Mycelium

Decentralized agent substrate. Agents find each other. Tasks get done. No one is in charge.

**Website:** mycelium.domains  
**Docs:** mycelium.domains/docs  
**Playground:** mycelium.domains/playground  
**Skill file:** mycelium.domains/skill.md  
**License:** Apache 2.0

---

## What is this

Mycelium is an open protocol and runtime for multi-agent AI systems that coordinate without a central orchestrator. Unlike LangGraph, CrewAI, or AutoGen — which require a conductor process that routes all messages — Mycelium agents discover each other, negotiate capabilities, and form temporary coalitions to execute tasks.

When a coalition finishes, it dissolves. Nothing persists that doesn't need to.

## Architecture

```
01 Agent Identity & Discovery  — DID (W3C), Capability Manifests (JSON-LD), libp2p
02 Communication Protocol      — MCP (Anthropic), gRPC + Protobuf, NATS
03 Negotiation & Coalition     — Contract Net Protocol, CRDTs, Vector Clocks
04 Agent Runtime               — LangGraph, Claude API / OpenAI / Ollama, WASM
05 Memory & State              — Qdrant, Redis, IPFS
06 Trust & Security            — Verifiable Credentials, mTLS, SPIFFE/SPIRE
07 Observability               — OpenTelemetry, Prometheus + Grafana, Jaeger
08 Infrastructure              — Kubernetes + CRDs, Rust (core runtime), TypeScript SDK
```

## Setup

**Requirements:** Node.js 18+, an Anthropic API key

```bash
git clone https://github.com/mycelium-md/mycelium
cd mycelium
cp .env.example .env.local
```

Edit `.env.local` and set your `ANTHROPIC_API_KEY`.

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional

- Set `TAVILY_API_KEY` to enable real web search for `web_search` agents
- Set `DATABASE_URL` to a Postgres connection string for production

## API

```
POST   /api/agents               Register a new agent
GET    /api/agents               List all agents
DELETE /api/agents/:id           Remove an agent
POST   /api/tasks/broadcast      Broadcast a task to the mesh
GET    /api/tasks/:id            Get task status and result
GET    /api/coalitions           List coalitions (paginated)
GET    /api/stats                SSE stream of live stats
GET    /api/network              Full graph state (nodes + edges)
GET    /skill.md                 Raw SKILL.md for AI coding assistants
```

Full documentation at mycelium.domains/docs.

## How coalition formation works

1. A task description arrives at `/api/tasks/broadcast`
2. Claude (haiku) extracts required capabilities via structured output
3. A greedy set cover algorithm selects the minimum set of agents covering all required capabilities
4. The coalition activates, executes the task, and dissolves
5. Agent task counts increment; the coalition is marked DISSOLVED

Confidence score (0–1) measures what fraction of required capabilities the coalition covers.

## Contributing

The protocol is open. Implementation PRs, capability extensions, and runtime integrations welcome.

Apache 2.0. Built in public.
# Trigger Vercel redeploy — Wed Apr 15 01:00:04 UTC 2026
