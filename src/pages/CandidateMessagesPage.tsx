import React, { useState, useEffect, useRef } from 'react';
import SEOHead from '../components/SEOHead';
import { API_ENDPOINTS } from '../config/env';
import { Send, Search, Menu, X, Info, MoreVertical, CheckCheck, Paperclip, ArrowLeft, Phone, Calendar, Star, Briefcase, MapPin, FileText } from 'lucide-react';

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
  isOnline?: boolean;
  messages?: any[];
}

interface Message {
  _id: string;
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const candidateId = currentUser.id || currentUser._id || currentUser.email;

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversationId);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => fetchMessages(selectedConversation.conversationId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-scroll when messages are loaded or updated
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, selectedConversation]);

  const fetchConversations = async () => {
    try {
      // Get all messages and group by conversation
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}?candidateId=${encodeURIComponent(candidateId)}`);
      if (response.ok) {
        const allMessages = await response.json();
        const conversationsMap = new Map<string, any>();

        // Group messages by conversation
        allMessages.forEach((msg: any) => {
          const conversationKey = [msg.senderId, msg.receiverId].sort().join('_');
          
          if (!conversationsMap.has(conversationKey)) {
            const isFromEmployer = msg.senderId !== candidateId;
            conversationsMap.set(conversationKey, {
              _id: conversationKey,
              conversationId: conversationKey,
              employerId: isFromEmployer ? msg.senderId : msg.receiverId,
              employerName: isFromEmployer ? (msg.senderName || msg.senderId) : (msg.receiverName || msg.receiverId),
              employerEmail: isFromEmployer ? (msg.senderEmail || '') : (msg.receiverEmail || ''),
              companyName: isFromEmployer ? msg.companyName : undefined,
              companyLogo: isFromEmployer ? msg.companyLogo : undefined,
              lastMessage: msg.message,
              lastMessageTime: msg.createdAt,
              unreadCount: msg.read === false && msg.receiverId === candidateId ? 1 : 0,
              isOnline: false,
            });
          } else {
            const conv = conversationsMap.get(conversationKey);
            conv.lastMessage = msg.message;
            conv.lastMessageTime = msg.createdAt;
            if (msg.read === false && msg.receiverId === candidateId) {
              conv.unreadCount = (conv.unreadCount || 0) + 1;
            }
          }
        });

        setConversations(Array.from(conversationsMap.values()));
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      } else if (response.status === 404) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const attachment = JSON.stringify({ __type: 'attachment', name: file.name, mimeType: file.type, data: reader.result as string });
      sendFileMessage(attachment, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendFileMessage = async (attachmentJson: string, fileName: string) => {
    if (!selectedConversation) return;
    setSendingMessage(true); setError('');
    try {
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: candidateId,
          receiverId: selectedConversation.employerId,
          senderName: currentUser.name || 'Candidate',
          senderEmail: currentUser.email,
          receiverName: selectedConversation.employerName,
          receiverEmail: selectedConversation.employerEmail,
          message: attachmentJson,
          conversationId: selectedConversation.conversationId,
          read: false,
        }),
      });
      if (response.ok) {
        const sent = await response.json();
        setMessages(prev => [...prev, sent]);
        setConversations(prev => prev.map(conv =>
          conv.conversationId === selectedConversation.conversationId
            ? { ...conv, lastMessage: `📎 ${fileName}`, lastMessageTime: new Date().toISOString() }
            : conv
        ));
      } else { setError('Failed to send file'); }
    } catch { setError('Error sending file'); }
    finally { setSendingMessage(false); }
  };

  const renderMessageContent = (message: string, isOwn: boolean) => {
    // Handle old text-format attachments like [📎 filename]
    if (message.startsWith('[') && message.includes('📎') && message.endsWith(']')) {
      const name = message.replace(/^\[📎\s*/, '').replace(/\]$/, '');
      return <span className="text-sm italic opacity-80">📎 {name} (legacy)</span>;
    }
    try {
      const parsed = JSON.parse(message);
      if (parsed.__type === 'attachment') {
        const isImage = parsed.mimeType?.startsWith('image/');
        if (isImage) {
          return (
            <div>
              <img
                src={parsed.data}
                alt={parsed.name}
                className="max-w-xs max-h-48 rounded-lg cursor-pointer hover:opacity-90 block"
                onClick={() => window.open(parsed.data, '_blank')}
              />
              <a
                href={parsed.data}
                download={parsed.name}
                className={`text-xs mt-1 flex items-center gap-1 underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
              >
                📎 {parsed.name}
              </a>
            </div>
          );
        }
        return (
          <a
            href={parsed.data}
            download={parsed.name}
            className={`flex items-center gap-2 text-sm underline font-medium ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
          >
            📎 {parsed.name}
          </a>
        );
      }
    } catch {}
    return <p className="text-sm break-words">{message}</p>;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    setError('');
    try {
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: candidateId,
          receiverId: selectedConversation.employerId,
          senderName: currentUser.name || 'Candidate',
          senderEmail: currentUser.email,
          receiverName: selectedConversation.employerName,
          receiverEmail: selectedConversation.employerEmail,
          message: newMessage,
          conversationId: selectedConversation.conversationId,
          read: false
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // Update conversation with latest message
        setConversations(prev => prev.map(conv =>
          conv.conversationId === selectedConversation.conversationId
            ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
            : conv
        ));
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.employerName && conv.employerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (conv.companyName && conv.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(true);
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => setIsTyping(false), 1500);
    setTypingTimeout(t);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-gray-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
          <>
      <SEOHead canonical="/candidate-messages" title="ZyncJobs Messages | Chat with Employers and Candidates" description="Manage recruiter and candidate conversations in one place with the ZyncJobs messaging inbox." />
      <div style={{display:'flex', flex:1, width:'100%', height:'100%', overflow:'hidden', minHeight:0, background:'#f8fafc'}}>

      {/* ── LEFT PANEL ── Conversations */}
      <div
        className={`${
          sidebarOpen ? 'flex' : 'hidden'
        } sm:flex flex-col flex-shrink-0 overflow-hidden bg-white`}
        style={{width:'320px', minWidth:'320px', height:'100%', display: sidebarOpen ? 'flex' : undefined, borderRight:'1px solid #e2e8f0', boxShadow:'2px 0 12px rgba(0,0,0,0.06)'}}
      >
        {/* Left Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100" style={{background:'linear-gradient(135deg, #1d4ed8 0%, #f97316 100%)'}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className="text-lg font-bold text-white">Messages</h1>
              {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                <span className="bg-white text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </span>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)} className="sm:hidden p-1.5 hover:bg-white/20 rounded-xl text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none text-white placeholder-white/60 transition-all"
              style={{background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)'}}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'linear-gradient(135deg, #1d4ed8 0%, #f97316 100%)'}}>
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-sm font-bold text-slate-800">No conversations yet</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Employers will appear here once they message you</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = selectedConversation?._id === conv._id;
              const hasUnread = conv.unreadCount > 0;
              return (
                <button
                  key={conv._id}
                  onClick={() => { setSelectedConversation(conv); setSidebarOpen(false); }}
                  className={`w-full px-4 py-3.5 text-left transition-all duration-150 relative group ${
                    isActive
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'border-l-4 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.companyLogo ? (
                        <img src={conv.companyLogo} alt={conv.employerName} className="w-11 h-11 rounded-2xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {getInitials(conv.employerName)}
                        </div>
                      )}
                      {conv.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-sm truncate ${
                          hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                        }`}>{conv.employerName}</span>
                        <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${
                          hasUnread ? 'font-medium text-slate-700' : 'text-slate-400'
                        }`}>
                          {conv.companyName ? `🏢 ${conv.companyName}` : conv.lastMessage || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── MIDDLE PANEL ── Chat */}
      {selectedConversation ? (
        <div className="flex flex-col min-h-0 bg-slate-50" style={{flex:1, overflow:'hidden', height:'100%'}}>

          {/* Chat Header */}
          <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0" style={{background:'linear-gradient(135deg, #1d4ed8 0%, #f97316 100%)', boxShadow:'0 2px 12px rgba(29,78,216,0.25)'}}>
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="sm:hidden p-2 hover:bg-white/20 rounded-xl text-white">
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative">
                {selectedConversation.companyLogo ? (
                  <img src={selectedConversation.companyLogo} alt={selectedConversation.employerName} className="w-10 h-10 rounded-2xl object-cover border-2 border-white/40" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-sm border border-white/30">
                    {getInitials(selectedConversation.employerName)}
                  </div>
                )}
                {selectedConversation.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">{selectedConversation.employerName}</h2>
                <p className="text-xs text-white/70 font-medium">
                  {selectedConversation.isOnline ? '● Online' : '○ Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowRightPanel(v => !v)}
                className={`p-2 rounded-xl transition-colors ${
                  showRightPanel ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-white/70'
                }`}
                title="Toggle info panel"
              >
                <Info className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/20 rounded-xl text-white/70" title="More">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)'}}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">💬</span>
                </div>
                <p className="font-semibold text-slate-700">No messages yet</p>
                <p className="text-sm text-slate-400 mt-1">Send a message to start the conversation</p>
              </div>
            ) : (
              <div className="space-y-2 flex flex-col">
                {messages.map((msg, idx) => {
                  const isOwn = msg.senderId === candidateId;
                  const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.senderId === candidateId);
                  return (
                    <div key={msg._id || idx} className={`flex items-end gap-2 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}>
                      {/* Receiver avatar */}
                      {!isOwn && (
                        <div className="flex-shrink-0 w-7 h-7">
                          {showAvatar ? (
                            selectedConversation.companyLogo ? (
                              <img src={selectedConversation.companyLogo} className="w-7 h-7 rounded-xl object-cover" alt="" />
                            ) : (
                              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                {getInitials(selectedConversation.employerName)}
                              </div>
                            )
                          ) : <div className="w-7 h-7" />}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`max-w-xs lg:max-w-sm ${
                        isOwn ? 'items-end' : 'items-start'
                      } flex flex-col`}>
                        <div className={`px-4 py-2.5 shadow-sm ${
                          isOwn
                            ? 'text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-slate-800 rounded-2xl rounded-bl-md border border-slate-100'
                        }`} style={isOwn ? {background:'linear-gradient(135deg, #1d4ed8, #f97316)'} : {}}>
                          {renderMessageContent(msg.message, isOwn)}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 px-1 ${
                          isOwn ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-slate-400">{formatMessageTime(msg.createdAt)}</span>
                          {isOwn && (
                            <CheckCheck className={`w-3.5 h-3.5 ${
                              msg.read ? 'text-blue-500' : 'text-slate-400'
                            }`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-700 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(selectedConversation.employerName)}
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="px-5 py-3 bg-white border-t border-slate-200 flex-shrink-0">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs mb-2 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError('')}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileInputRef} type="file" className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileAttach}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) handleSendMessage();
                  }}
                  placeholder="Write a message..."
                  disabled={sendingMessage}
                  className="w-full px-4 py-2.5 bg-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60 pr-10"
                />
                <button className="absolute right-3 top-2.5 text-slate-400 hover:text-yellow-500 transition-colors" title="Emoji">
                  <span className="text-lg leading-none">😀</span>
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="p-2.5 bg-gradient-to-br from-blue-700 to-orange-500 text-white rounded-2xl hover:from-blue-800 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex-shrink-0"
                title="Send"
              >
                {sendingMessage
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #f0f7ff 0%, #fff7ed 100%)'}}>
          <div className="text-center">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl" style={{background:'linear-gradient(135deg, #1d4ed8 0%, #f97316 100%)'}}>
              <span className="text-5xl">💬</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Messages</h2>
            <p className="text-slate-400 text-sm">Select a conversation from the left to start chatting</p>
            <div className="flex items-center justify-center gap-6 mt-8">
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🔒</span>
                </div>
                <p className="text-xs text-slate-500">Encrypted</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">⚡</span>
                </div>
                <p className="text-xs text-slate-500">Real-time</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">📎</span>
                </div>
                <p className="text-xs text-slate-500">File sharing</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT PANEL ── Profile / Info */}
      {selectedConversation && showRightPanel && (
        <div className="hidden lg:flex flex-col flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto" style={{width:'260px', minWidth:'260px', height:'100%'}}>
          {/* Profile Header */}
          <div className="flex flex-col items-center px-5 pt-8 pb-5 border-b border-slate-100" style={{background:'linear-gradient(135deg, #1d4ed8 0%, #f97316 100%)'}}>
            {selectedConversation.companyLogo ? (
              <img src={selectedConversation.companyLogo} alt={selectedConversation.employerName}
                className="w-16 h-16 rounded-2xl object-cover shadow-md mb-3 border-2 border-white/40" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl shadow-md mb-3 border border-white/30">
                {getInitials(selectedConversation.employerName)}
              </div>
            )}
            <h3 className="font-bold text-white text-sm text-center">{selectedConversation.employerName}</h3>
            {selectedConversation.companyName && (
              <p className="text-xs text-white/70 mt-0.5 text-center">{selectedConversation.companyName}</p>
            )}
            <span className={`mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${
              selectedConversation.isOnline
                ? 'bg-emerald-400/30 text-white border border-emerald-300/50'
                : 'bg-white/20 text-white/70 border border-white/20'
            }`}>
              {selectedConversation.isOnline ? '● Online' : '○ Offline'}
            </span>
          </div>

          {/* Info Rows */}
          <div className="px-4 py-4 space-y-3 border-b border-slate-100">
            {selectedConversation.employerEmail && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">📧</span>
                </div>
                <p className="text-xs text-slate-600 truncate">{selectedConversation.employerEmail}</p>
              </div>
            )}
            {selectedConversation.companyName && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-xs text-slate-600">{selectedConversation.companyName}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm text-slate-700 font-medium transition-colors">
              <Phone className="w-4 h-4" />
              Schedule Call
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 rounded-xl text-sm text-slate-700 font-medium transition-colors">
              <Calendar className="w-4 h-4" />
              Set Interview
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-yellow-50 hover:text-yellow-700 rounded-xl text-sm text-slate-700 font-medium transition-colors">
              <Star className="w-4 h-4" />
              Shortlist
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-green-50 hover:text-green-700 rounded-xl text-sm text-slate-700 font-medium transition-colors">
              <FileText className="w-4 h-4" />
              View Resume
            </button>
          </div>

          {/* Shared Files placeholder */}
          <div className="px-4 py-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Shared Files</p>
            {messages.filter(m => {
              try { return JSON.parse(m.message).__type === 'attachment'; } catch { return false; }
            }).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No files shared yet</p>
            ) : (
              messages.filter(m => {
                try { return JSON.parse(m.message).__type === 'attachment'; } catch { return false; }
              }).slice(-3).map((m, i) => {
                try {
                  const f = JSON.parse(m.message);
                  return (
                    <a key={i} href={f.data} download={f.name}
                      className="flex items-center gap-2 py-1.5 text-xs text-blue-600 hover:underline truncate">
                      <Paperclip className="w-3 h-3 flex-shrink-0" />
                      {f.name}
                    </a>
                  );
                } catch { return null; }
              })
            )}
          </div>
        </div>
      )}
    </div>
  </>
  );
};

export default CandidateMessagesPage;
