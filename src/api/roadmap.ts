import { apiFetch } from './apiFetch';
import { config } from '../config/env';

const BASE = `${config.API_URL}/roadmaps`;

export interface SaveRoadmapPayload {
  userId: string;
  currentRole: string;
  targetRole: string;
  experience: string;
  roadmapData: object;
  completedSteps: number[];
}

export async function saveRoadmapToDB(payload: SaveRoadmapPayload): Promise<void> {
  await apiFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchRoadmapFromDB(userId: string): Promise<SaveRoadmapPayload | null> {
  const res = await apiFetch(`${BASE}/${encodeURIComponent(userId)}`);
  if (!res.ok) return null;
  return res.json();
}
