import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/*
 * The AgriPulse typographic pairing (DESIGN.md): Plus Jakarta Sans for
 * structural headers, Inter for analytical readouts. Loaded through
 * next/font so the swap is font-metric adjusted and there is no layout shift.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgriPrice — sell now or hold",
  description:
    "Farm dashboard that shows, per crop, whether to sell now or hold, and what waiting is worth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
