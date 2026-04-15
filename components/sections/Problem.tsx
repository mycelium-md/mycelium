import { codeToHtml } from "shiki";

const LANGGRAPH_CODE = `# LangGraph: manual orchestration
from langgraph.graph import StateGraph, END

# You must define who calls who.
# You must handle every failure path.
# You must coordinate tool handoffs.
# You are the conductor.

workflow = StateGraph(AgentState)
workflow.add_node("researcher", research_agent)
workflow.add_node("writer", writer_agent)
workflow.add_node("reviewer", review_agent)

# Explicit routing — breaks if any node fails
workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", "reviewer")
workflow.add_conditional_edges(
    "reviewer",
    should_revise,
    {"revise": "writer", "done": END}
)

# One node fails. The whole graph stalls.
app = workflow.compile()`;

export default async function ProblemSection() {
  let highlighted: string;
  try {
    highlighted = await codeToHtml(LANGGRAPH_CODE, {
      lang: "python",
      theme: "github-dark",
    });
  } catch {
    highlighted = `<pre><code>${LANGGRAPH_CODE}</code></pre>`;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-section">
      {/* Section label */}
      <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-[#8866aa] mb-10 md:mb-12">
        01 — The Problem
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Code block */}
        <div className="min-w-0">
          <div className="border border-[#2a1a4a] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a1a4a] bg-[#0d0d2b]">
              <div className="w-2 h-2 rounded-full bg-[#3a2a5a]" />
              <div className="w-2 h-2 rounded-full bg-[#3a2a5a]" />
              <div className="w-2 h-2 rounded-full bg-[#3a2a5a]" />
              <span className="ml-2 font-mono text-[10px] text-[#8866aa]">
                orchestration.py
              </span>
            </div>
            <div
              className="p-4 overflow-x-auto text-xs"
              style={{ background: "#080818" }}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        </div>

        {/* Prose */}
        <div className="flex flex-col gap-6 pt-2">
          <h2
            className="font-syne font-700 tracking-tight text-text"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2.5rem)", lineHeight: "1.05" }}
          >
            Every multi-agent framework today requires a conductor.
          </h2>

          <div className="flex flex-col gap-4 text-[#9988bb] font-syne text-sm leading-relaxed">
            <p>
              LangGraph. CrewAI. AutoGen. They all share the same architectural assumption:
              one process that knows the full task graph, routes messages between agents, and
              decides what runs when.
            </p>
            <p>
              That conductor is a single point of failure. When it crashes, all agents stop.
              When it scales, every agent call routes through one bottleneck. When you add a new
              agent type, you rewrite the routing logic.
            </p>
            <p>
              The conductor also creates coupling. Agents cannot discover each other. They cannot
              negotiate. They are function calls inside someone else&apos;s workflow.
            </p>
          </div>

          <div className="border-l-2 border-accent pl-5 mt-2">
            <p className="font-serif italic text-text text-lg leading-snug">
              &ldquo;The problem is not the agents. The problem is the topology.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
