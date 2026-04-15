const LAYERS = [
  {
    num: "01",
    name: "Agent Identity & Discovery",
    techs: [
      { name: "DID (W3C)", href: "https://www.w3.org/TR/did-core/" },
      { name: "Capability Manifests (JSON-LD)", href: "https://json-ld.org/" },
      { name: "libp2p", href: "https://libp2p.io/" },
    ],
  },
  {
    num: "02",
    name: "Communication Protocol",
    techs: [
      { name: "MCP (Anthropic)", href: "https://modelcontextprotocol.io/" },
      { name: "gRPC + Protobuf", href: "https://grpc.io/" },
      { name: "NATS", href: "https://nats.io/" },
    ],
  },
  {
    num: "03",
    name: "Negotiation & Coalition",
    techs: [
      { name: "Contract Net Protocol", href: "https://en.wikipedia.org/wiki/Contract_Net_Protocol" },
      { name: "CRDTs", href: "https://crdt.tech/" },
      { name: "Vector Clocks", href: "https://en.wikipedia.org/wiki/Vector_clock" },
    ],
  },
  {
    num: "04",
    name: "Agent Runtime",
    techs: [
      { name: "LangGraph", href: "https://langchain-ai.github.io/langgraph/" },
      { name: "Claude API / OpenAI / Ollama", href: "https://docs.anthropic.com/" },
      { name: "WASM (Wasmtime)", href: "https://wasmtime.dev/" },
    ],
  },
  {
    num: "05",
    name: "Memory & State",
    techs: [
      { name: "Qdrant", href: "https://qdrant.tech/" },
      { name: "Redis", href: "https://redis.io/" },
      { name: "IPFS", href: "https://ipfs.tech/" },
    ],
  },
  {
    num: "06",
    name: "Trust & Security",
    techs: [
      { name: "Verifiable Credentials", href: "https://www.w3.org/TR/vc-data-model/" },
      { name: "mTLS", href: "https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/" },
      { name: "SPIFFE/SPIRE", href: "https://spiffe.io/" },
    ],
  },
  {
    num: "07",
    name: "Observability",
    techs: [
      { name: "OpenTelemetry", href: "https://opentelemetry.io/" },
      { name: "Prometheus + Grafana", href: "https://prometheus.io/" },
      { name: "Jaeger", href: "https://www.jaegertracing.io/" },
    ],
  },
  {
    num: "08",
    name: "Infrastructure",
    techs: [
      { name: "Kubernetes + CRDs", href: "https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/" },
      { name: "Rust (core runtime)", href: "https://www.rust-lang.org/" },
      { name: "TypeScript SDK", href: "https://github.com/mycelium-md/mycelium" },
    ],
  },
];

export default function TechStackSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-section">
      <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-[#8866aa] mb-16">
        03 — Architecture
      </p>

      <h2
        className="font-syne font-700 tracking-tight text-text mb-16"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", lineHeight: "1.05" }}
      >
        Eight layers. One mesh.
      </h2>

      <div className="flex flex-col">
        {LAYERS.map((layer, i) => (
          <div
            key={layer.num}
            className={`grid grid-cols-12 gap-4 py-6 border-b border-[#1a1a3a] group hover:bg-[#0d0d0d] transition-colors -mx-6 px-6 ${
              i % 2 === 1 ? "" : ""
            }`}
          >
            {/* Number */}
            <div className="col-span-1">
              <span className="font-syne text-xs text-[#3a2a5a] font-600">{layer.num}</span>
            </div>

            {/* Name */}
            <div className={`col-span-5 ${i % 2 === 1 ? "col-start-2" : ""}`}>
              <p className="font-syne text-sm font-600 text-text group-hover:text-accent transition-colors">
                {layer.name}
              </p>
            </div>

            {/* Techs */}
            <div className="col-span-6 flex flex-wrap gap-x-6 gap-y-1">
              {layer.techs.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-syne text-xs text-[#8866aa] hover:text-accent transition-colors"
                >
                  {tech.name}
                  <span className="ml-0.5 opacity-40">↗</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
