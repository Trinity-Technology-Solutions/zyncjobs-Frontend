/**
 * Tracks the role of the user whose logout is currently in progress.
 *
 * After logout begins we clear `user`, `lastUserType` and tokens before
 * navigating. A guard like <AuthGuard> may still render mid-transition and
 * try to redirect to its default candidate login. This module keeps the
 * resolved role alive long enough for every redirect after a logout to go to
 * the correct login page, making logout idempotent.
 */
let pendingLogoutRole: string | null = null;

export function setPendingLogoutRole(role: string | null): void {
  pendingLogoutRole = role;
}

export function clearPendingLogoutRole(): void {
  pendingLogoutRole = null;
}

export function getPendingLogoutRole(): string | null {
  return pendingLogoutRole;
}