import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriPrice — sell now or hold",
  description:
    "Farm dashboard that shows, per crop, whether to sell now or hold, and what waiting is worth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
