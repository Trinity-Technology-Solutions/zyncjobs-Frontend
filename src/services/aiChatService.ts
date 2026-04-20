export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const API_KEY = () => import.meta.env.VITE_OPENROUTER_API_KEY as string;
const FAST_MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free'; // faster than mistral-7b
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY()}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'ZyncJobs',
  };
}

// Non-streaming — for JSON responses (Roadmap, Assessment)
export async function sendAIMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
  maxTokens = 800
): Promise<string> {
  const apiKey = API_KEY();
  if (!apiKey) throw new Error('No API key');

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: FAST_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.4, // lower = faster + more deterministic JSON
    }),
    signal,
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty response');
  return reply;
}

// Streaming — for chat (CareerCoach, Recruiter, ChatWidget)
export async function sendAIMessageStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = API_KEY();
  if (!apiKey) throw new Error('No API key');

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: FAST_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 600,
      temperature: 0.7,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
      try {
        const json = JSON.parse(line.slice(6));
        const token = json.choices?.[0]?.delta?.content;
        if (token) onChunk(token);
      } catch { /* skip malformed chunks */ }
    }
  }
}

// Assessment questions — needs more tokens for 10 questions JSON
export async function generateAssessmentQuestions(skill: string): Promise<any[]> {
  const prompt = `Generate exactly 10 MCQ questions for "${skill}".
Return ONLY a JSON array, no markdown, no explanation:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0}]
correctAnswer is 0-3 index. Mix difficulty levels.`;

  const reply = await sendAIMessage(
    [{ role: 'user', content: prompt }],
    'You are a technical assessment expert. Return only a valid JSON array, nothing else.',
    undefined,
    1200 // enough for 10 questions
  );
  const match = reply.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid AI response');
  const questions = JSON.parse(match[0]);
  return questions.slice(0, 10).map((q: any, i: number) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

// Career roadmap — needs more tokens for 4-step JSON
export async function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  experience: string
): Promise<any> {
  const prompt = `Career roadmap from "${currentRole}" to "${targetRole}", experience: ${experience}.
Return ONLY valid JSON:
{"currentRole":"...","targetRole":"...","totalTimeframe":"...","summary":"...","steps":[{"step":1,"title":"...","timeframe":"...","skills":["s1","s2","s3","s4"],"description":"...","milestone":"..."}],"finalTip":"..."}
Exactly 4 steps. Skills must be specific tech skills.`;

  const reply = await sendAIMessage(
    [{ role: 'user', content: prompt }],
    'You are a career coach. Return only valid JSON, no markdown.',
    undefined,
    1200
  );
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid response');
  return JSON.parse(match[0]);
}

// Generic AI call — CareerCoach, Recruiter backend fallback
export async function callAIWithFallback(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (!API_KEY()) throw new Error('No API key configured');
  return sendAIMessage(messages, systemPrompt, signal, 600);
}
