/**
 * getId — resolves PostgreSQL `id` field, with fallback to MongoDB `_id`.
 * Use this everywhere instead of `obj._id || obj.id`
 */
export const getId = (obj: any): string => {
  if (!obj) return '';
  return String(obj.id || obj._id || '');
};

export const getApplicationJobId = (jobId: unknown): string =>
  typeof jobId === 'string' || typeof jobId === 'number' ? String(jobId) : getId(jobId);
