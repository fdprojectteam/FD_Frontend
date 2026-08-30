import type { AdminPermission, AdminRole } from '@/types/admin';

/**
 * What each role may see, and what it may change.
 *
 * ## The distinction this file exists to make
 *
 * **Visibility is not permission to change.** An auditor sees every screen and
 * can act on nothing; a product admin proposes a rate change but cannot approve
 * their own proposal. Modelling those as separate permissions is what makes the
 * maker–checker demonstration meaningful rather than decorative.
 *
 * ## This is not authorisation
 *
 * There is no authentication, no server and nothing enforcing any of this
 * beyond the components that read it. In production the same table would live
 * behind an API and be checked there; here it decides what a screen renders and
 * nothing more. Every screen that hides an action for a role says so in those
 * terms.
 *
 * Pure and React-free.
 */

const OPERATIONS: readonly AdminPermission[] = [
  'customers.view',
  'applications.view',
  'applications.decide',
  'products.view',
  /*
    The checker. Operations approves what Product proposes — the separation is
    the whole point, so this role can approve but never propose.
  */
  'products.approve',
  'kyc.view',
  'support.view',
  'audit.view',
];

const PRODUCT: readonly AdminPermission[] = [
  'products.view',
  'products.propose',
  'applications.view',
  'audit.view',
];

const SUPPORT: readonly AdminPermission[] = [
  'support.view',
  'support.act',
  'customers.view',
  'applications.view',
  'kyc.view',
  'audit.view',
];

/** Everything visible, nothing actionable. */
const AUDITOR: readonly AdminPermission[] = [
  'customers.view',
  'applications.view',
  'products.view',
  'kyc.view',
  'support.view',
  'audit.view',
];

export const ROLE_PERMISSIONS: Readonly<Record<AdminRole, readonly AdminPermission[]>> = {
  operations: OPERATIONS,
  product: PRODUCT,
  support: SUPPORT,
  auditor: AUDITOR,
};

export const ROLE_LABEL: Record<AdminRole, string> = {
  operations: 'Operations Administrator',
  product: 'Product Administrator',
  support: 'Support Administrator',
  auditor: 'Auditor',
};

export const PERMISSION_LABEL: Record<AdminPermission, string> = {
  'customers.view': 'Customer visibility',
  'applications.view': 'Application visibility',
  'applications.decide': 'Application decisions',
  'products.view': 'Product visibility',
  'products.propose': 'Propose product changes',
  'products.approve': 'Approve product changes',
  'kyc.view': 'Verification visibility',
  'support.view': 'Support visibility',
  'support.act': 'Support actions',
  'audit.view': 'Audit visibility',
};

/**
 * Said in the interface, not only in a comment.
 *
 * The shell renders this, so an operator reading the console is told the same
 * thing a developer reading this file is: the role selector changes what is
 * displayed and nothing else.
 */
export const PERMISSIONS_ARE_NOT_AUTHORISATION =
  'Roles here decide what this console displays. They are not authorisation: there is no authentication in this build and nothing enforces them beyond the interface.';

export function can(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Why an action is unavailable, in the operator's words.
 *
 * Shown in place of the control rather than as a disabled button with no
 * explanation — an operations console that silently omits an action is one
 * whose users learn to distrust it.
 */
export function deniedReason(role: AdminRole, permission: AdminPermission): string {
  return `${ROLE_LABEL[role]} does not hold “${PERMISSION_LABEL[permission]}”. Switch role to demonstrate this action.`;
}
