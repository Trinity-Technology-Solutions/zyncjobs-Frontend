interface CandidateRecord { id?: string; _id?: string; [key: string]: unknown }

// Load every API page before publishing counts, search results, or duplicate groups.
export async function loadAllTalentCandidates(
  fetchPage: (page: number, limit: number) => Promise<unknown>,
): Promise<CandidateRecord[]> {
  const records = new Map<string, CandidateRecord>();
  let expectedTotal: number | undefined;
  for (let page = 1; ; page++) {
    const response = await fetchPage(page, 200);
    if (Array.isArray(response)) {
      if (page !== 1) throw new Error('Invalid Talent Pool pagination response.');
      return response;
    }
    const data = response as { candidates?: CandidateRecord[]; total?: number; limit?: number; page?: number } | null;
    if (!data || !Array.isArray(data.candidates) || !Number.isInteger(data.total) || data.total! < 0
      || !Number.isInteger(data.limit) || data.limit! < 1 || data.page !== page) {
      throw new Error('Invalid Talent Pool pagination response.');
    }
    expectedTotal ??= data.total!;
    if (data.total !== expectedTotal) throw new Error('Talent Pool changed while loading. Please refresh again.');
    for (const candidate of data.candidates) {
      const id = candidate.id || candidate._id;
      if (!id) throw new Error('Talent Pool returned a candidate without an ID.');
      records.set(id, candidate);
    }
    if (page * data.limit! >= expectedTotal) {
      if (records.size !== expectedTotal) throw new Error('Talent Pool changed while loading. Please refresh again.');
      return [...records.values()];
    }
    if (!data.candidates.length) throw new Error('Unable to load all Talent Pool candidates. Please refresh again.');
  }
}
