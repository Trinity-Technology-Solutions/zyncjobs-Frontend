import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Send, Search, Menu, X, Info, MoreVertical, Check, CheckCheck, Paperclip, Plus } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-white" style={{height: '100%', overflow: 'hidden', minHeight: 0}}>
      {/* Sidebar - Conversations List */}
      <div className={`${sidebarOpen ? 'w-full' : 'hidden'} sm:flex flex-col bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden`} style={{width: '360px', minWidth: '360px'}}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💬</span>
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Employers will appear here once they message you</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => {
                  setSelectedConversation(conv);
                  setSidebarOpen(false);
                }}
                className={`w-full px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${
                  selectedConversation?._id === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.companyLogo ? (
                      <img src={conv.companyLogo} alt={conv.employerName} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(conv.employerName)}
                      </div>
                    )}
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{conv.employerName}</h3>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formatTime(conv.lastMessageTime)}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                  </div>

                  {/* Unread Badge */}
                  {conv.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Contact Info */}
              <div className="relative">
                {selectedConversation.companyLogo ? (
                  <img src={selectedConversation.companyLogo} alt={selectedConversation.employerName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(selectedConversation.employerName)}
                  </div>
                )}
                {selectedConversation.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">{selectedConversation.employerName}</h2>
                <p className="text-xs text-gray-500">
                  {selectedConversation.isOnline ? '🟢 Online' : '⚫ Offline'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Info">
                <Info className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="More">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col justify-end min-h-full">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="text-gray-600 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation by sending a message!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.senderId === candidateId;
                    return (
                      <div key={msg._id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm px-3 py-2 rounded-2xl ${
                          isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          {renderMessageContent(msg.message, isOwn)}
                          <div className={`flex items-center justify-end gap-1 mt-0.5 ${
                            isOwn ? 'text-blue-100' : 'text-gray-400'
                          } text-xs`}>
                            <span>{formatMessageTime(msg.createdAt)}</span>
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
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white py-3 flex-shrink-0">
            <div className="max-w-2xl mx-auto px-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-2">
                  {error}
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileAttach}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 flex-shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) handleSendMessage();
                  }}
                  placeholder="Write a message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">💬</span>
            </div>
            <p className="text-gray-600 font-medium text-lg">Select a conversation</p>
            <p className="text-sm text-gray-500 mt-2">Choose a message from the list to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateMessagesPage;
