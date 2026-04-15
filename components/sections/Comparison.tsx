const ROWS = [
  {
    name: "LangGraph",
    coordination: "Directed graph, explicit routing",
    failure: "Graph halts on node failure",
    scalability: "Single-process bottleneck",
    coupling: "Tightly coupled by design",
    protocol: "Proprietary",
    isMycelium: false,
  },
  {
    name: "CrewAI",
    coordination: "Role-based, sequential or hierarchical",
    failure: "Agent failure stalls crew",
    scalability: "Limited by crew size",
    coupling: "Role dependencies hardcoded",
    protocol: "Proprietary",
    isMycelium: false,
  },
  {
    name: "AutoGen",
    coordination: "Conversational, LLM-routed",
    failure: "Conversation loop breaks",
    scalability: "Token-bounded conversations",
    coupling: "Message-passing tightly ordered",
    protocol: "Proprietary",
    isMycelium: false,
  },
  {
    name: "Mycelium",
    coordination: "Emergent coalition via Contract Net",
    failure: "Coalition re-forms; no single point",
    scalability: "Horizontal, peer-to-peer",
    coupling: "Capability-based, zero hardcoding",
    protocol: "Open — Apache 2.0",
    isMycelium: true,
  },
];

const COLS = [
  { key: "coordination", label: "Coordination model" },
  { key: "failure", label: "Failure handling" },
  { key: "scalability", label: "Scalability" },
  { key: "coupling", label: "Agent coupling" },
  { key: "protocol", label: "Open protocol" },
] as const;

export default function ComparisonSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-section">
      <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-[#8866aa] mb-10 md:mb-16">
        04 — Comparison
      </p>

      {/* Scrollable wrapper to prevent layout overflow on mobile */}
      <div className="overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6">
        <div className="min-w-[640px]">
          <table className="comparison-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Framework</th>
                {COLS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.name} className={row.isMycelium ? "mycelium-row" : ""}>
                  <td className="font-syne font-600 text-sm">{row.name}</td>
                  {COLS.map((col) => (
                    <td key={col.key} className="font-syne text-sm text-[#9988bb]">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
