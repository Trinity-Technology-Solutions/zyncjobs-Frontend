const employerRoutes = new Set([
  '/dashboard', '/job-posting-selection', '/job-posting', '/job-parsing', '/bulk-job-import',
  '/job-management', '/my-jobs', '/application-management', '/candidate-search',
  '/candidate-ranking', '/ai-recruiter', '/job-refresh-management', '/employer-complete-profile', '/settings',
]);
export function getEmployerReturnPath(state: any): string {
  const from = state?.from;
  if (!from || !employerRoutes.has(from.pathname)) return '/dashboard';
  return from.pathname + (typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '') +
    (typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '');
}
