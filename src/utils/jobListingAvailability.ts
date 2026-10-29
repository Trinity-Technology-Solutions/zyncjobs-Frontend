interface ListingJob {
  id?: string; _id?: string; title?: string; jobTitle?: string;
  isActive?: boolean; status?: string; isDeleted?: boolean;
  deletedAt?: string | null; applicationDeadline?: string | null;
}

export const normalizedJobTitle = (title: string) => title.trim().replace(/\s+/g, ' ').toLowerCase();

export function availableListingJobs<T extends ListingJob>(jobs: T[], now = Date.now()): T[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    if (job.isActive === false || job.isDeleted || job.deletedAt) return false;
    if (job.status && !['approved', 'active'].includes(job.status.toLowerCase())) return false;
    if (job.applicationDeadline) {
      const deadline = Date.parse(job.applicationDeadline);
      if (!Number.isFinite(deadline) || deadline < now) return false;
    }
    const id = job.id || job._id;
    if (id && seen.has(id)) return false;
    if (id) seen.add(id);
    return true;
  });
}

export function listingTitleCounts(jobs: ListingJob[]) {
  const titles = new Map<string, { title: string; count: number }>();
  for (const job of jobs) {
    const title = (job.title || job.jobTitle || '').trim().replace(/\s+/g, ' ');
    if (!title) continue;
    const key = normalizedJobTitle(title);
    const entry = titles.get(key) || { title, count: 0 };
    entry.count++; titles.set(key, entry);
  }
  return [...titles.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}
