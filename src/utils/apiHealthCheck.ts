import { API_ENDPOINTS } from '../config/env';

interface HealthResult {
  endpoint: string;
  url: string;
  status: 'ok' | 'error' | 'auth_required';
  httpStatus?: number;
  latencyMs?: number;
  error?: string;
}

const PROBE_ENDPOINTS: Array<{ name: string; url: string }> = [
  { name: 'jobs',              url: API_ENDPOINTS.JOBS },
  { name: 'companies',         url: API_ENDPOINTS.COMPANIES },
  { name: 'search',            url: API_ENDPOINTS.SEARCH },
  { name: 'notifications',     url: API_ENDPOINTS.NOTIFICATIONS },
  { name: 'admin_system_health', url: API_ENDPOINTS.ADMIN_SYSTEM_HEALTH },
];

async function probeEndpoint(name: string, url: string): Promise<HealthResult> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
    const latencyMs = Math.round(performance.now() - t0);
    const status = res.ok ? 'ok' : res.status === 401 || res.status === 403 ? 'auth_required' : 'error';
    return { endpoint: name, url, status, httpStatus: res.status, latencyMs };
  } catch (err: any) {
    return { endpoint: name, url, status: 'error', error: err?.message ?? String(err) };
  }
}

export async function runApiHealthCheck(): Promise<HealthResult[]> {
  const results = await Promise.all(
    PROBE_ENDPOINTS.map(({ name, url }) => probeEndpoint(name, url))
  );

  const failed = results.filter(r => r.status === 'error');
  if (failed.length) {
    console.warn('[API Health] Failed endpoints:', failed.map(r => `${r.endpoint} → ${r.error ?? r.httpStatus}`));
  } else {
    console.info('[API Health] All endpoints reachable ✓');
  }

  return results;
}
