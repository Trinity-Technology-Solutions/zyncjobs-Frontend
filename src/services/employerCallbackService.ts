import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS } from '../config/env';

export interface EmployerCallbackRequest {
  name: string;
  phone: string;
  email: string;
  hiringFor: string;
}

/** Send employer callback details to the backend SMTP handler. */
export async function submitEmployerCallbackRequest(request: EmployerCallbackRequest): Promise<void> {
  const name = request.name.trim();
  const phone = request.phone.trim();
  const email = request.email.trim();
  const hiringFor = request.hiringFor.trim();

  const send = (url: string, body: Record<string, string>) => apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let response = await send(API_ENDPOINTS.EMPLOYER_CALLBACK, { name, email, phone, hiringFor });

  // Older deployed backends may not have the dedicated callback endpoint yet.
  if (response.status === 404) {
    response = await send(API_ENDPOINTS.CONTACT, {
      name,
      email,
      subject: 'Employer callback request',
      message: `Phone: ${phone}\nHiring for: ${hiringFor}`,
    });
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    throw new Error(result?.error || result?.message || 'Unable to send your callback request. Please try again.');
  }
}
