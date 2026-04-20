import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const SYSTEM_PROMPT = 'You are a helpful assistant for ZyncJobs, a job portal. Help users with job searching, resume tips, interview prep, and career advice. Be concise and friendly.';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Welcome! How can I help you with ZyncJobs today?", sender: "bot" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setIsLoading(true);

    // Add empty bot message to stream into
    setMessages(prev => [...prev, { text: '', sender: 'bot' }]);

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages.map(m => ({ 
            role: m.sender === 'user' ? 'user' : 'assistant', 
            content: m.text 
          }))
        })
      });

      if (!response.ok) throw new Error('Backend error');
      
      const data = await response.json();
      
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: data.reply || data.message, sender: 'bot' };
        return updated;
      });
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: "Sorry, I'm having trouble connecting. Please try again.", sender: 'bot' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-[9999]"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border z-[9998]">
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-sm">ZyncJobs</h3>
              <p className="text-xs opacity-90">Hi there 👋 How can we help?</p>
            </div>
            <button 
              type="button"
              onClick={() => setIsOpen(false)} 
              title="Close chat"
              className="text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-3 h-64 overflow-y-auto space-y-2">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs p-2 rounded-lg text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.text || (isLoading && index === messages.length - 1 ? <span className="animate-pulse">▍</span> : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isLoading}
              title="Send message"
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
