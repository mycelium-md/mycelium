import Link from "next/link";
import Image from "next/image";

const LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
  { href: "https://github.com/mycelium-md/mycelium", label: "GitHub", external: true },
  { href: "https://x.com/mycelium_md", label: "X / Twitter", external: true },
  { href: "/skill.md", label: "/skill.md", external: true },
];

export default function FooterSection() {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
        {/* Wordmark + tagline */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-white.png"
              alt="Mycelium"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-syne font-700 text-sm tracking-wide">MYCELIUM</span>
          </div>
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
