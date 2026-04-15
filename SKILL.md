---
name: mycelium
description: >
  Use this skill when building multi-agent systems that require decentralized coordination.
  Covers agent registration, capability broadcasting, coalition formation, task routing,
  and distributed execution without a central orchestrator.
  Trigger when: building agent meshes, replacing LangGraph/CrewAI orchestration,
  implementing fault-tolerant agent systems, or any peer-to-peer AI coordination.
license: Apache-2.0
compatibility: >
  TypeScript/JavaScript (native SDK), Python (via HTTP client), any language with HTTP.
  Requires: Node.js 18+, PostgreSQL or SQLite, Anthropic API key.
---

# Mycelium Agent Substrate — Developer Skill

## What Mycelium does

Mycelium is a decentralized substrate for multi-agent AI systems. Agents register their
capabilities, tasks broadcast to the mesh, and temporary coalitions form to execute work —
no central orchestrator required.

Unlike LangGraph, CrewAI, or AutoGen, Mycelium has no conductor process that routes messages
or defines agent relationships. Every agent is a peer. Coordination is emergent.

**When to use Mycelium:**
- You need agents that can discover and coordinate with each other dynamically
- You want fault tolerance without fallback routing logic
- You are migrating from LangGraph/CrewAI and need to remove the orchestrator
- You are building agent infrastructure that others will build on top of

**When NOT to use Mycelium:**
- You need strict sequential pipelines with fixed step order
- You have fewer than 3 agents and no need for discovery
- You need synchronous request/response patterns (use a simple API instead)

---

## Core concepts

### Agent

An agent is a process that declares its capabilities and registers with the mesh. It has:
- `id`: UUID assigned at registration
- `name`: human-readable identifier
- `capabilities`: subset of the 6 supported capability types
- `taskCount`: number of tasks completed (used for node sizing in network viz)

### Capability types

| Capability | When to assign |
|---|---|
| `web_search` | Agent can search the internet |
| `code_execution` | Agent can run code/scripts |
| `text_generation` | Agent can write/summarize/translate |
| `data_analysis` | Agent can process datasets/statistics |
| `file_operations` | Agent can read/write files |
| `api_calls` | Agent can call external APIs |

### Task

A task is a natural language description of work to be done. When broadcast:
1. Claude (haiku) extracts required capabilities from the description
2. A greedy set cover algorithm finds the minimum viable coalition
3. The coalition executes the task and dissolves

### Coalition

A coalition is a temporary group of agents formed to complete a specific task.
Lifecycle: `FORMING → ACTIVE → DISSOLVED`

Coalitions form in under 500ms on a warm stack. They dissolve when the task completes or fails.

### Capability matcher

The matcher uses Claude structured output to extract capabilities, then runs greedy set cover:
```
minimum_coalition = greedy_set_cover(required_capabilities, available_agents)
```

This guarantees the coalition has every required capability while minimizing agent count.

---

## API Reference

Base URL: `https://mycelium.domains` (or your self-hosted instance)

All endpoints return `{ data: T }` on success or `{ error: string }` on failure.

### Register an agent

```
POST /api/agents
Content-Type: application/json

{
  "name": "string",          // required, 1-255 chars
  "capabilities": string[]   // required, subset of 6 capability types
}

→ 201 { data: Agent }
→ 400 { error: "validation message" }
→ 429 { error: "rate limit exceeded" }
```

### List agents

```
GET /api/agents
→ 200 { data: Agent[] }
```

### Remove agent

```
DELETE /api/agents/:id
→ 204 No Content
→ 404 { error: "Agent not found" }
```

### Broadcast a task

```
POST /api/tasks/broadcast
Content-Type: application/json

{
  "description": "string"    // required, min 3 chars
}

→ 202 {
    data: {
      taskId: string,
      coalitionId: string,
      requiredCapabilities: string[],
      coalition: Array<{ id: string, name: string }>,
      confidence: number,    // 0-1, coverage of required capabilities
      reasoning: string,
      status: "EXECUTING"
    }
  }
→ 422 { error: "No agents registered" | "No agents matched" }
```

### Get task status

```
GET /api/tasks/:id
→ 200 {
    data: {
      id: string,
      description: string,
      requiredCaps: string[],
      status: "PENDING" | "MATCHING" | "EXECUTING" | "COMPLETED" | "FAILED",
      result: string | null,
      createdAt: string,
      completedAt: string | null,
      coalitionId: string | null
    }
  }
```

### List coalitions

```
GET /api/coalitions?page=1&limit=20
→ 200 {
    data: {
      coalitions: Coalition[],
      pagination: { page, limit, total, pages }
    }
  }
```

### Live stats (SSE)

```
GET /api/stats
Accept: text/event-stream

→ Server-Sent Events, emits every 5s:
data: {
  "agentsTotal": number,
  "coalitionsToday": number,
  "tasksCompleted": number,
  "activeCoalitions": number
}
```

### Network graph

```
GET /api/network
→ 200 {
    data: {
      nodes: Array<{
        id, name, capabilities, taskCount, activeCoalition
      }>,
      edges: Array<{
        source, target, coalitionId, status
      }>
    }
  }
```

---

## Code examples

### TypeScript — register and broadcast

```typescript
const BASE = 'https://mycelium.domains';

// Register an agent
const agentRes = await fetch(`${BASE}/api/agents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'ResearchAgent-01',
    capabilities: ['web_search', 'text_generation'],
  }),
});
const { data: agent } = await agentRes.json();

// Broadcast a task and poll for result
const taskRes = await fetch(`${BASE}/api/tasks/broadcast`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Find the three most cited papers on transformer attention mechanisms published in 2024.',
  }),
});
const { data: broadcast } = await taskRes.json();

// Poll until complete
async function waitForTask(taskId: string): Promise<string> {
  while (true) {
    const res = await fetch(`${BASE}/api/tasks/${taskId}`);
    const { data: task } = await res.json();
    if (task.status === 'COMPLETED') return task.result;
    if (task.status === 'FAILED') throw new Error(task.result);
    await new Promise(r => setTimeout(r, 2000));
  }
}

const result = await waitForTask(broadcast.taskId);
console.log(result);
```

### Python — minimal client

```python
import httpx, time

BASE = "https://mycelium.domains"
client = httpx.Client()

# Register
agent = client.post(f"{BASE}/api/agents", json={
    "name": "AnalysisAgent-01",
    "capabilities": ["data_analysis", "code_execution", "text_generation"],
}).json()["data"]

# Broadcast
broadcast = client.post(f"{BASE}/api/tasks/broadcast", json={
    "description": "Compute the Fibonacci sequence up to n=30 and return it as JSON.",
}).json()["data"]

# Wait for result
while True:
    task = client.get(f"{BASE}/api/tasks/{broadcast['taskId']}").json()["data"]
    if task["status"] == "COMPLETED":
        print(task["result"])
        break
    elif task["status"] == "FAILED":
        raise Exception(task["result"])
    time.sleep(2)
```

### Subscribe to live stats

```typescript
const es = new EventSource('https://mycelium.domains/api/stats');

es.onmessage = (event) => {
  const stats = JSON.parse(event.data);
  console.log(`Agents: ${stats.agentsTotal}, Tasks done: ${stats.tasksCompleted}`);
};

// Always clean up
window.addEventListener('beforeunload', () => es.close());
```

---

## Integration patterns

### MCP integration

Mycelium speaks MCP natively. To expose a Mycelium agent as an MCP tool:

```typescript
// agent-manifest.json (JSON-LD)
{
  "@context": "https://mycelium.domains/context/v1",
  "@type": "Agent",
  "id": "did:mycelium:agent-uuid",
  "name": "MyAgent",
  "capabilities": ["text_generation", "api_calls"],
  "mcp": {
    "transport": "http",
    "endpoint": "https://your-agent.example.com/mcp"
  }
}
```

### Migrating from LangGraph

Replace this:
```python
# LangGraph: hardcoded graph
workflow = StateGraph(AgentState)
workflow.add_node("researcher", research_agent)
workflow.add_node("writer", writer_agent)
workflow.add_edge("researcher", "writer")
app = workflow.compile()
result = app.invoke({"task": "..."})
```

With this:
```python
# Mycelium: broadcast and let the mesh handle it
result = await broadcast_task("Research X and write a summary")
# The mesh discovers which agents can do research + writing,
# forms a coalition, and dissolves it when done.
```

### Standalone (self-hosted)

```bash
git clone https://github.com/mycelium-md/mycelium
cd mycelium
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY
npm install
npx prisma db push
npm run dev
# Mesh running at http://localhost:3000
```

---

## Error handling

All API errors follow this shape:
```json
{ "error": "Human-readable message", "code": "OPTIONAL_CODE" }
```

| Status | Meaning |
|---|---|
| 400 | Invalid request body |
| 404 | Resource not found |
| 422 | Semantic error (no agents, no match) |
| 429 | Rate limit — back off and retry |
| 500 | Server error — check logs |

Rate limits (default): 20 req/min for reads, 10/min for agent registration, 5/min for task broadcasts.

---

## Self-hosting

Required environment variables:
```
DATABASE_URL="file:./mycelium.db"     # SQLite (dev) or postgres://... (prod)
ANTHROPIC_API_KEY="sk-ant-..."         # Required for capability matching
TAVILY_API_KEY="tvly-..."              # Optional: enables web_search capability
```

Database setup:
```bash
npx prisma db push          # Apply schema (SQLite)
npx prisma migrate dev      # Generate migrations (production)
```
