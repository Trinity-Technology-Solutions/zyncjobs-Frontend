import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Send, Search, ArrowLeft, CheckCheck, Paperclip, Trash2, MessageSquare } from 'lucide-react';

interface Conversation {
  _id: string;
  conversationId: string;
  employerId: string;
  employerName: string;
  employerEmail: string;
  companyName?: string;
  companyLogo?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id?: string;
  _id?: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const CandidateMessagesPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const candidateId = currentUser.id || currentUser._id || currentUser.email;

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;
    fetchMessages(selectedConversation.conversationId);
    const interval = setInterval(() => fetchMessages(selectedConversation.conversationId), 3000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}?candidateId=${encodeURIComponent(candidateId)}`);
      if (!res.ok) { setConversations([]); return; }
      const allMessages = await res.json();
      const map = new Map<string, any>();
      allMessages.forEach((msg: any) => {
        const key = [msg.senderId, msg.receiverId].sort().join('_');
        if (!map.has(key)) {
          const isFromEmployer = msg.senderId !== candidateId;
          map.set(key, {
            _id: key,
            conversationId: key,
            employerId: isFromEmployer ? msg.senderId : msg.receiverId,
            employerName: isFromEmployer ? (msg.senderName || msg.senderId) : (msg.receiverName || msg.receiverId),
            employerEmail: isFromEmployer ? (msg.senderEmail || '') : (msg.receiverEmail || ''),
            companyName: isFromEmployer ? msg.companyName : undefined,
            companyLogo: isFromEmployer ? msg.companyLogo : undefined,
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt,
            unreadCount: msg.read === false && msg.receiverId === candidateId ? 1 : 0,
          });
        } else {
          const conv = map.get(key);
          conv.lastMessage = msg.message;
          conv.lastMessageTime = msg.createdAt;
          if (msg.read === false && msg.receiverId === candidateId) conv.unreadCount++;
        }
      });
      setConversations(Array.from(map.values()));
    } catch { setConversations([]); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}/${conversationId}`);
      if (res.ok) setMessages(await res.json() || []);
      else if (res.status === 404) setMessages([]);
    } catch {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSendingMessage(true); setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: candidateId,
          receiverId: selectedConversation.employerId,
          senderName: currentUser.name || 'Candidate',
          senderEmail: currentUser.email,
          receiverName: selectedConversation.employerName,
          receiverEmail: selectedConversation.employerEmail,
          message: newMessage.trim(),
          conversationId: selectedConversation.conversationId,
          read: false,
        }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => [...prev, sent]);
        setNewMessage('');
        setConversations(prev => prev.map(c =>
          c.conversationId === selectedConversation.conversationId
            ? { ...c, lastMessage: newMessage.trim(), lastMessageTime: new Date().toISOString() }
            : c
        ));
      } else setError('Failed to send message');
    } catch { setError('Network error'); }
    finally { setSendingMessage(false); }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      if (!selectedConversation) return;
      const attachment = JSON.stringify({ __type: 'attachment', name: file.name, mimeType: file.type, data: reader.result });
      setSendingMessage(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.MESSAGES}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: candidateId, receiverId: selectedConversation.employerId,
            senderName: currentUser.name || 'Candidate', senderEmail: currentUser.email,
            receiverName: selectedConversation.employerName, receiverEmail: selectedConversation.employerEmail,
            message: attachment, conversationId: selectedConversation.conversationId, read: false,
          }),
        });
        if (res.ok) { const sent = await res.json(); setMessages(prev => [...prev, sent]); }
      } catch {} finally { setSendingMessage(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}/delete/${msgId}?userId=${encodeURIComponent(candidateId)}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setMessages(prev => prev.filter(m => (m.id || m._id) !== msgId));
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to delete message');
      }
    } catch { setError('Error deleting message'); }
  };

  const renderContent = (message: string, isOwn: boolean) => {
    try {
      const p = JSON.parse(message);
      if (p.__type === 'attachment') {
        if (p.mimeType?.startsWith('image/')) return (
          <div>
            <img src={p.data} alt={p.name} className="max-w-xs max-h-40 rounded-lg cursor-pointer" onClick={() => window.open(p.data, '_blank')} />
            <a href={p.data} download={p.name} className={`text-xs mt-1 flex items-center gap-1 underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}>📎 {p.name}</a>
          </div>
        );
        return <a href={p.data} download={p.name} className={`flex items-center gap-1 text-sm underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}>📎 {p.name}</a>;
      }
    } catch {}
    return <p className="break-words">{message}</p>;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatTime = (ts: string) => {
    const d = new Date(ts), now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  };

  const filtered = conversations.filter(c =>
    c.employerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading messages...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden">

      {/* ── Left Panel: Conversation List ── */}
      <div className={`
        flex flex-col bg-white border-r border-gray-200
        w-full md:w-80 lg:w-96 flex-shrink-0
        ${showChat ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            {onNavigate && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            {conversations.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {conversations.length}
              </span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center">
              <MessageSquare className="w-12 h-12 mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs mt-1">Employers will appear here once they message you</p>
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv._id}
                onClick={() => { setSelectedConversation(conv); setShowChat(true); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selectedConversation?._id === conv._id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conv.companyLogo ? (
                    <img src={conv.companyLogo} alt={conv.employerName}
                      className="w-11 h-11 rounded-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                    />
                  ) : null}
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm ${conv.companyLogo ? 'hidden' : ''}`}>
                    {getInitials(conv.employerName || '?')}
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-gray-900 truncate">{conv.employerName}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat ── */}
      <div className={`
        flex-1 flex flex-col bg-white min-w-0 h-full
        ${showChat ? 'flex' : 'hidden md:flex'}
      `}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
              {/* Back button (mobile) */}
              <button
                onClick={() => setShowChat(false)}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {/* Avatar */}
              {selectedConversation.companyLogo ? (
                <>
                  <img src={selectedConversation.companyLogo} alt={selectedConversation.employerName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                  />
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hidden">
                    {getInitials(selectedConversation.employerName || '?')}
                  </div>
                </>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(selectedConversation.employerName || '?')}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 text-sm truncate">{selectedConversation.employerName}</h2>
                {selectedConversation.companyName && (
                  <p className="text-xs text-gray-400 truncate">{selectedConversation.companyName}</p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 flex flex-col justify-end">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 max-w-3xl mx-auto w-full">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.senderId === candidateId;
                    const msgId = msg.id || msg._id || String(idx);
                    return (
                      <div
                        key={msgId}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-1 group`}
                        onMouseEnter={() => isOwn && setHoveredMsgId(msgId)}
                        onMouseLeave={() => setHoveredMsgId(null)}
                      >
                        {/* Delete button — own messages */}
                        {isOwn && hoveredMsgId === msgId && (
                          <button
                            onClick={() => deleteMessage(msgId)}
                            className="p-1 text-gray-300 hover:text-red-400 rounded transition-colors mb-1"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Bubble */}
                        <div className={`max-w-xs sm:max-w-sm lg:max-w-md px-3.5 py-2.5 rounded-2xl shadow-sm ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                        }`}>
                          <div className="text-sm leading-relaxed">{renderContent(msg.message, isOwn)}</div>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwn && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="text-red-400 ml-2">×</button>
                </div>
              )}
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <input ref={fileInputRef} type="file" className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                  onChange={handleFileAttach} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition flex-shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
                >
                  {sendingMessage
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected (desktop empty state) */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center px-6 h-full">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-700 font-semibold text-base">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-1">Choose a message from the left to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateMessagesPage;
