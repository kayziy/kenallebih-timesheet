import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fh = Fredoka({ variable: "--fh", subsets: ["latin"] });
const fb = Nunito({ variable: "--fb", subsets: ["latin"] });

export const metadata: Metadata = { title: "Timesheet Kenallebih", description: "Jam kerja, KPI, dan catatan harian tim Kenallebih" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${fh.variable} ${fb.variable}`}>
      <body>{children}</body>
    </html>
  );
}
