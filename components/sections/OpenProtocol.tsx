import { readFileSync } from "fs";
import { join } from "path";
import { codeToHtml } from "shiki";

function getSkillMd(): string {
  try {
    return readFileSync(join(process.cwd(), "SKILL.md"), "utf-8");
  } catch {
    return "# SKILL.md not yet generated.";
  }
}

export default async function OpenProtocolSection() {
  const skillContent = getSkillMd();
  // Show first 40 lines only in the preview embed
  const preview = skillContent.split("\n").slice(0, 40).join("\n");

  let highlighted: string;
  try {
    highlighted = await codeToHtml(preview, {
      lang: "markdown",
      theme: "github-dark",
    });
  } catch {
    highlighted = `<pre style="color:#f5f5f0">${preview}</pre>`;
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-section">
      <p className="font-syne text-xs font-600 uppercase tracking-[0.2em] text-[#6b6b78] mb-16">
        05 — Open Protocol
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="flex flex-col gap-8">
          <h2
            className="font-syne font-700 tracking-tight text-text"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", lineHeight: "1.05" }}
          >
            Mycelium is infrastructure,<br />not a product.
          </h2>

          <div className="flex flex-col gap-4 font-syne text-sm text-[#9999aa] leading-relaxed">
            <p>
              The protocol is open. The runtime is yours. Mycelium does not run your agents — 
              it gives them a substrate to find each other, negotiate, and coordinate.
            </p>
            <p>
              Every interface is documented. Every data format is an open standard. You can run
              Mycelium on your own infrastructure, fork the protocol, or build your own
              implementation from the spec.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="font-syne text-xs uppercase tracking-[0.15em] text-[#6b6b78]">License</span>
              <span className="font-syne text-xs text-text">Apache 2.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-syne text-xs uppercase tracking-[0.15em] text-[#6b6b78]">Source</span>
              <a
                href="https://github.com/mycelium-md/mycelium"
                target="_blank"
                rel="noopener noreferrer"
                className="font-syne text-xs text-accent hover:underline"
              >
                github.com/mycelium-md/mycelium ↗
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-syne text-xs uppercase tracking-[0.15em] text-[#6b6b78]">Skill file</span>
              <a
                href="/skill.md"
                target="_blank"
                rel="noopener noreferrer"
                className="font-syne text-xs text-accent hover:underline"
              >
                mycelium.domains/skill.md ↗
              </a>
            </div>
          </div>
        </div>

        {/* SKILL.md embed */}
        <div>
          <div className="border border-[#2a2a30] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a30] bg-[#111114]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3a3a40]" />
                <div className="w-2 h-2 rounded-full bg-[#3a3a40]" />
                <div className="w-2 h-2 rounded-full bg-[#3a3a40]" />
                <span className="ml-2 font-mono text-[10px] text-[#6b6b78]">SKILL.md</span>
              </div>
              <a
                href="/skill.md"
                target="_blank"
                rel="noopener noreferrer"
                className="font-syne text-[10px] text-[#6b6b78] hover:text-accent transition-colors"
              >
                view raw ↗
              </a>
            </div>
            <div
              className="p-4 overflow-x-auto text-xs max-h-[420px] overflow-y-auto"
              style={{ background: "#0d1117" }}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
