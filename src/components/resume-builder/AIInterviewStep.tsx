import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, CheckCircle, MessageSquare } from 'lucide-react';
import { executeAI } from '../../services/aiChatService';
import { executeResumeAI } from '../../services/resumeAIClient';
import { useResumeStore } from '../../store/useResumeStore';

interface Props {
  onComplete: () => void;
}

const INTERVIEW_PROMPT = `You are an expert resume interviewer. Your job is to ask the user questions one at a time to build their resume.

Cover these topics in a natural conversational order, one question at a time:
1. Current role / target role
2. Years of experience
3. Key skills (technical + soft)
4. Work experience (ask about each role: title, company, duration, key achievements)
5. Education (degree, institution, year)
6. Certifications or awards
7. Notable projects
8. Professional summary

Rules:
- Ask ONLY ONE question at a time
- Keep questions conversational and friendly
- After every 2-3 user answers, silently summarize collected data
- Do NOT list multiple questions
- When you have enough info to build a complete resume, say "I have enough information to build your resume!" and summarize what you collected
- Use emoji sparingly
- Keep responses concise (2-3 sentences max per message)`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIInterviewStep({ onComplete }: Props) {
  const { data, update, updatePersonalInfo, addExperience, updateExperience } = useResumeStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey there! 👋 I'm your AI resume builder. Let's get started — what's your current role or the role you're targeting?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      const allMessages = [...messages, { role: 'user' as const, content: text }];
      const history = allMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const data = await executeAI(`resume interview: ${text}`, {
        systemPrompt: INTERVIEW_PROMPT,
        history,
        maxTokens: 500,
      });
      const reply = extractInterviewReply(data);
      const isReady = reply.toLowerCase().includes('enough information') || reply.toLowerCase().includes('build your resume');

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (isReady) setReady(true);

      // Silently extract data from the conversation
      extractData(allMessages);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Got it! Let me continue — tell me more about your experience." }]);
    } finally {
      setSending(false);
    }
  };

  const extractData = async (msgs: ChatMessage[]) => {
    if (collecting) return;
    setCollecting(true);
    const conversation = msgs.map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
    try {
      const res = await executeResumeAI({
        section: 'resume',
        action: 'parse',
        content: `Extract resume data from this interview conversation:\n\n${conversation}\n\nReturn JSON with: personalInfo {name, email, phone}, skills (array), experience (array of {title, company, duration, bullets}), education (array of {degree, institution, duration}), summary. Use empty arrays for missing fields.`,
      });
      if (res.result && typeof res.result === 'object') {
        const d = res.result as any;
        if (d.skills?.length) update('skills', d.skills);
        if (d.summary) update('summary', d.summary);
        if (d.experience?.length) {
          d.experience.forEach((exp: any, i: number) => {
            if (i === 0 && data.experience.length === 0) addExperience();
            const id = data.experience[i]?.id;
            if (id) {
              if (exp.title) updateExperience(id, 'title', exp.title);
              if (exp.company) updateExperience(id, 'company', exp.company);
              if (exp.duration) updateExperience(id, 'duration', exp.duration);
              if (exp.bullets?.length) updateExperience(id, 'bullets', exp.bullets);
            }
          });
        }
        if (d.education?.length) update('education', d.education);
        if (d.personalInfo?.name) updatePersonalInfo('name', d.personalInfo.name);
      }
    } catch { /* silent — incremental extraction is best-effort */ } finally {
      setCollecting(false);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">AI Resume Interview</h2>
          <p className="text-xs text-gray-500">Answer a few questions — AI builds your resume</p>
        </div>
        {ready && (
          <button onClick={handleComplete}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <CheckCircle className="w-4 h-4" />
            Finish & Edit
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-md'
                  : 'bg-gray-100 text-gray-800 rounded-tl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-gray-100 text-sm text-gray-500 rounded-tl-md">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type your answer..."
            disabled={sending || ready}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:opacity-40"
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending || ready}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {collecting && (
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Silently updating your resume data...
          </p>
        )}
        {ready && !collecting && (
          <p className="text-xs text-green-600 mt-2 font-medium">✓ Resume data collected! Click "Finish & Edit" to review and refine.</p>
        )}
      </div>
    </div>
  );
}

function extractInterviewReply(data: any): string {
  const r = data?.result;
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (r.reply) return r.reply;
  if (r.result && typeof r.result === 'string') return r.result;
  return 'Tell me more about that.';
}
