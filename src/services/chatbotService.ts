/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface SourceInfo {
  title: string;
  url: string;
  category: string;
}

export interface ChatbotMessage {
  role: 'user' | 'bot';
  text: string;
  intent?: string;
  sources?: SourceInfo[];
  timestamp: number;
}

export interface ChatbotV2Response {
  reply: string;
  intent: string;
  session_id: string;
  sources: SourceInfo[];
  is_fallback: boolean;
}

export async function sendChatbotMessage(
  message: string,
  sessionId: string | null,
  userId?: string | null,
  userRole = 'candidate'
): Promise<ChatbotV2Response> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId, language: 'en' }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return {
    reply: data.response || data.reply || 'No response available',
    intent: data.intent || 'CHAT',
    session_id: sessionId || '',
    sources: data.sources || [],
    is_fallback: data.is_fallback || false,
  };
}

// Direct brain access for specific AI features — routes through backend
export async function executeBrain(
  query: string,
  context?: Record<string, unknown>,
  userRole = 'candidate'
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, context, user_role: userRole }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
