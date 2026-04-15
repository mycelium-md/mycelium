"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/playground", label: "Playground" },
  { href: "/network", label: "Network" },
  { href: "https://github.com/mycelium-md/mycelium", label: "GitHub", external: true },
  { href: "https://x.com/mycelium_md", label: "X", external: true },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a3a] bg-bg/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo-white.png"
            alt="Mycelium"
            width={28}
            height={28}
            className="object-contain"
            priority
          />
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
