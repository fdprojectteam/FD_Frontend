/**
 * Dashboard experience layout — empty shell reserved for the authenticated
 * sidebar experience (Portfolio, Reports; Phase 3+ per roadmap §1.2).
 * No sidebar, no auth, no role checks yet (T0.10 scope). No routes exist
 * in this group until those phases begin.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
