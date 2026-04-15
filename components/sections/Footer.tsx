import Link from "next/link";

const MyceliumWordmark = () => (
  <div className="flex items-center gap-3">
    <svg width="24" height="24" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="100,10 182,55 182,145 100,190 18,145 18,55" fill="#1e1e24"/>
      <line x1="60" y1="72"  x2="100" y2="94" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      <line x1="100" y1="94" x2="140" y2="72" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      <line x1="60"  y1="72"  x2="60"  y2="128" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      <line x1="140" y1="72"  x2="140" y2="128" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      <line x1="60"  y1="72"  x2="116" y2="114" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
      <line x1="140" y1="72"  x2="84"  y2="114" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
      <line x1="84"  y1="114" x2="60"  y2="128" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
      <line x1="116" y1="114" x2="140" y2="128" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
      <line x1="84"  y1="114" x2="116" y2="114" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.55"/>
      <circle cx="60"  cy="72"  r="8"  fill="white"/>
      <circle cx="140" cy="72"  r="8"  fill="white"/>
      <circle cx="60"  cy="128" r="8"  fill="white"/>
      <circle cx="140" cy="128" r="8"  fill="white"/>
      <circle cx="100" cy="94"  r="11" fill="#9B5FE3"/>
      <circle cx="84"  cy="114" r="6"  fill="white" opacity="0.7"/>
      <circle cx="116" cy="114" r="6"  fill="white" opacity="0.7"/>
    </svg>
    <span className="font-syne font-700 text-sm tracking-wide">MYCELIUM</span>
  </div>
);

const LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
  { href: "https://github.com/mycelium-md/mycelium", label: "GitHub", external: true },
  { href: "/skill.md", label: "/skill.md", external: true },
];

export default function FooterSection() {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
        {/* Wordmark + tagline */}
        <div className="flex flex-col gap-3">
          <MyceliumWordmark />
          <p className="font-syne text-xs text-[#8866aa] max-w-[280px]">
            The substrate AI agents run on.<br />
            Open protocol. No orchestrator.
          </p>
        </div>

        {/* Links */}
        <nav className="flex gap-10">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-syne text-xs text-[#8866aa] hover:text-text transition-colors self-start"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="font-syne text-xs text-[#8866aa] hover:text-text transition-colors self-start"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>

      <div className="border-t border-[#1a1a3a] pt-8">
        <p className="font-syne text-xs text-[#3a2a5a]">
          Built in public.
        </p>
      </div>
    </footer>
  );
}
