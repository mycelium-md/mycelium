"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MyceliumLogo = () => (
  <svg width="28" height="28" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <circle cx="100" cy="94"  r="11" fill="#5DCAA5" className="animate-pulse-glow"/>
    <circle cx="84"  cy="114" r="6"  fill="white" opacity="0.7"/>
    <circle cx="116" cy="114" r="6"  fill="white" opacity="0.7"/>
  </svg>
);

const navLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
  { href: "/network", label: "Network" },
  { href: "https://github.com/mycelium-md/mycelium", label: "GitHub", external: true },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1f] bg-bg/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <MyceliumLogo />
          <span className="font-syne font-700 text-sm tracking-wide text-text">MYCELIUM</span>
        </Link>

        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-syne text-xs font-500 tracking-wide text-text-muted hover:text-text transition-colors duration-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`font-syne text-xs font-500 tracking-wide transition-colors duration-200 ${
                  pathname === link.href
                    ? "text-accent"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
}
