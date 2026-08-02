import type { Metadata } from 'next';
import localFont from 'next/font/local';

import './globals.css';
import { Providers } from './providers';

/**
 * Inter (client decision 2026-07-30) — self-hosted variable font.
 * Self-hosting keeps builds deterministic and avoids a third-party fetch
 * at build/run time (Document 15 — no external dependency for core UI).
 */
const inter = localFont({
  src: '../assets/fonts/inter-variable-latin.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'FD Investment Platform',
  description: "Discover, compare, and invest in Fixed Deposits from India's most trusted banks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
