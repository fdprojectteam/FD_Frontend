import type { Route } from 'next';

import { ROUTES } from './routes';

/**
 * Navigation configuration (T1.13).
 *
 * Typed so components never change when destinations become available:
 * set `route` and flip `enabled` to true, and the shell picks it up.
 * Items with `enabled: false` render visually identical but non-interactive
 * (`aria-disabled`, no href) — routing is wired when the destination exists.
 *
 * `match` controls active detection against the current pathname:
 *   'exact'  — pathname === route
 *   'prefix' — pathname === route or starts with `${route}/`
 *
 * Accessibility convention (approved 2026-07-30): **exactly one
 * `aria-current="page"` per navigation landmark**. The desktop Main nav and
 * the mobile Primary tab bar are independent landmarks, so each marks its
 * own current item; only one is presented per breakpoint, and screen
 * readers interpret each within its own region.
 */
export type NavMatch = 'exact' | 'prefix';

export interface NavItem {
  label: string;
  /**
   * Present only when the destination exists. Typed as Next's `Route` so
   * typedRoutes validates it at compile time — a nav entry can never point
   * at a route that does not exist.
   */
  route?: Route;
  enabled: boolean;
  match?: NavMatch;
  /** Icon key for icon-only surfaces (mobile bottom bar). */
  icon?: 'home' | 'portfolio' | 'profile' | 'help';
}

/** Primary navigation — approved UI: Marketplace · Portfolio · Support. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Marketplace', route: ROUTES.home, enabled: true, match: 'exact' },
  /*
    The guided path, reachable from every page rather than only from Home.
    `prefix` so the item stays current for anything under the planner later.
  */
  { label: 'Plan by goal', route: ROUTES.goalPlanner, enabled: true, match: 'prefix' },
  { label: 'Portfolio', route: ROUTES.portfolio, enabled: true, match: 'prefix' },
  { label: 'Support', enabled: false },
] as const;

/** Mobile bottom bar — approved mobile UI: four icon-only destinations. */
export const MOBILE_TAB_NAV: readonly NavItem[] = [
  { label: 'Home', route: ROUTES.home, enabled: true, match: 'exact', icon: 'home' },
  {
    label: 'Portfolio',
    route: ROUTES.portfolio,
    enabled: true,
    match: 'prefix',
    icon: 'portfolio',
  },
  { label: 'Profile', enabled: false, icon: 'profile' },
  { label: 'Help', enabled: false, icon: 'help' },
] as const;

/** Footer link columns — approved UI. */
export const FOOTER_NAV: readonly { heading: string; items: readonly NavItem[] }[] = [
  {
    heading: 'Company',
    items: [
      { label: 'About', enabled: false },
      { label: 'Careers', enabled: false },
    ],
  },
  {
    heading: 'Legal',
    items: [
      { label: 'Terms', enabled: false },
      { label: 'Privacy', enabled: false },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help center', enabled: false },
      { label: 'Contact', enabled: false },
    ],
  },
] as const;

/** Condensed footer links shown below the md breakpoint (approved mobile UI). */
export const FOOTER_COMPACT_NAV: readonly NavItem[] = [
  { label: 'Terms', enabled: false },
  { label: 'Privacy', enabled: false },
  { label: 'Help', enabled: false },
] as const;

/** True when `pathname` activates `item` per its match rule. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (!item.enabled || !item.route) return false;
  return item.match === 'prefix'
    ? pathname === item.route || pathname.startsWith(`${item.route}/`)
    : pathname === item.route;
}
