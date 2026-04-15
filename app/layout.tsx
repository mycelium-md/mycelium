import type { Metadata } from "next";
import { Syne, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mycelium — Decentralized Agent Substrate",
  description:
    "Agents find each other. Tasks get done. No one is in charge. An open protocol for decentralized multi-agent coordination.",
  keywords: ["AI agents", "multi-agent systems", "decentralized", "MCP", "agent coordination"],
  openGraph: {
    title: "Mycelium",
    description: "The substrate AI agents run on.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${instrumentSerif.variable}`}>
      <body className="bg-bg text-text antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
