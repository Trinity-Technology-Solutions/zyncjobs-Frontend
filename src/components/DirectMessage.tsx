import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Send, X, MessageCircle, Paperclip, Trash2 } from 'lucide-react';

interface DirectMessageProps {
  candidateId: string;       // may be UUID or email
  candidateName: string;
  candidateEmail: string;
  employerId: string;        // UUID
  onClose: () => void;
}

const DirectMessage: React.FC<DirectMessageProps> = ({
  candidateId,
  candidateName,
  candidateEmail,
  employerId,
  onClose
}) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const senderName = currentUser.name || 'Employer';
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resolvedCandidateId, setResolvedCandidateId] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resolve candidate UUID from email if needed
  useEffect(() => {
    const resolve = async () => {
      const isEmail = (s: string) => s.includes('@');
      const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

      // If candidateId is already a UUID, use it directly
      if (candidateId && isUUID(candidateId)) {
        setResolvedCandidateId(candidateId);
        return;
      }

      // Try to resolve UUID from email
      const emailToLookup = candidateEmail || (isEmail(candidateId) ? candidateId : '');
      if (!emailToLookup) {
        setResolvedCandidateId(candidateId || '');
        return;
      }

      try {
        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/users/by-email/${encodeURIComponent(emailToLookup)}`);
        if (res.ok) {
          const data = await res.json();
          const uid = data.id || data._id || data.userId;
          if (uid) { setResolvedCandidateId(uid); return; }
        }
      } catch { /* ignore */ }

      // Fallback: try profile endpoint
      try {
        const res2 = await fetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(emailToLookup)}`);
        if (res2.ok) {
          const data2 = await res2.json();
          const uid2 = data2.userId || data2.id;
          if (uid2) { setResolvedCandidateId(uid2); return; }
        }
      } catch { /* ignore */ }

      // Last resort: use email as-is
      setResolvedCandidateId(emailToLookup);
    };
    resolve();
  }, [candidateId, candidateEmail]);

  const conversationId = resolvedCandidateId && employerId
    ? [employerId, resolvedCandidateId].sort().join('_')
    : '';

  useEffect(() => {
    if (conversationId) fetchMessages();
    else setFetchLoading(false);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setFetchLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}/${conversationId}`);
      if (res.ok) setMessages(await res.json() || []);
      else if (res.status === 404) setMessages([]);
    } catch { /* silent */ }
    finally { setFetchLoading(false); }
  };

  const doSend = async (messageBody: string) => {
    if (!resolvedCandidateId || !employerId) {
      setError('Cannot send message: missing sender or receiver ID.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: employerId,
          receiverId: resolvedCandidateId,
          senderName,
          senderEmail: currentUser.email,
          companyName: currentUser.companyName || currentUser.company || '',
          receiverName: candidateName,
          receiverEmail: candidateEmail,
          message: messageBody,
          conversationId,
        }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => [...prev, sent]);
        setSuccessMessage('Sent!');
        setTimeout(() => setSuccessMessage(''), 2000);

        // Track nvite_sent recruiter action for the candidate
        try {
          const currentUserData = localStorage.getItem('user');
          if (currentUserData) {
            const currentUser = JSON.parse(currentUserData);
            if (currentUser.userType === 'employer' || currentUser.role === 'employer') {
              // Fetch fresh employer profile for real company name
              let company = currentUser.companyName || currentUser.company || '';
              let location = currentUser.location || '';
              let recruiterTitle = currentUser.title || currentUser.jobTitle || 'HR';
              let profilePicture = currentUser.profilePhoto || currentUser.profilePicture || '';

              try {
                const empRes = await fetch(`${(import.meta.env.VITE_API_URL || '/api')}/profile/${encodeURIComponent(currentUser.email)}`);
                if (empRes.ok) {
                  const empData = await empRes.json();
                  company = empData.companyName || empData.company || company;
                  location = empData.location || location;
                  recruiterTitle = empData.title || empData.jobTitle || recruiterTitle;
                  profilePicture = empData.profilePhoto || empData.profilePicture || profilePicture;
                }
              } catch { /* use localStorage values */ }

              // Also try User endpoint
              try {
                const userId = currentUser.id || currentUser._id;
                if (userId) {
                  const userRes = await fetch(`${(import.meta.env.VITE_API_URL || '/api')}/users/${userId}`);
                  if (userRes.ok) {
                    const userData = await userRes.json();
                    company = userData.companyName || userData.company || company;
                    location = userData.location || location;
                  }
                }
              } catch { /* ignore */ }

              // Email domain fallback
              if (!company && currentUser.email) {
                const domain = currentUser.email.split('@')[1];
                if (domain && !['gmail.com','yahoo.com','outlook.com','hotmail.com'].includes(domain)) {
                  company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
                }
              }

              await fetch(`${(import.meta.env.VITE_API_URL || '/api')}/analytics-tracking/track/recruiter-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: candidateEmail,
                  action: 'nvite_sent',  // kept as nvite_sent in DB, displayed as Job Invite
                  recruiterId: currentUser.id || currentUser._id,
                  recruiterEmail: currentUser.email,
                  recruiterName: senderName,
                  recruiterTitle,
                  company,
                  location,
                  profilePicture,
                }),
              });
              window.dispatchEvent(new CustomEvent('analyticsRefresh'));
            }
          }
        } catch { /* silent */ }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Failed to send message');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.MESSAGES}/delete/${msgId}?userId=${encodeURIComponent(employerId)}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setMessages(prev => prev.filter(m => (m.id || m._id) !== msgId));
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to delete message');
      }
    } catch { setError('Error deleting message'); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await doSend(newMessage.trim());
    setNewMessage('');
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const attachment = JSON.stringify({
        __type: 'attachment',
        name: file.name,
        mimeType: file.type,
        data: reader.result,
      });
      doSend(attachment);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const renderContent = (message: string, isOwn: boolean) => {
    if (!message) return null;
    try {
      const parsed = JSON.parse(message);
      if (parsed.__type === 'attachment') {
        const isImage = parsed.mimeType?.startsWith('image/');
        if (isImage) {
          return (
            <div>
              <img src={parsed.data} alt={parsed.name}
                className="max-w-full max-h-40 rounded-lg cursor-pointer hover:opacity-90 block mb-1"
                onClick={() => window.open(parsed.data, '_blank')} />
              <a href={parsed.data} download={parsed.name}
                className={`text-xs flex items-center gap-1 underline hover:no-underline mt-1 ${isOwn ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}>
                📎 {parsed.name}
              </a>
            </div>
          );
        }
        return (
          <a href={parsed.data} download={parsed.name}
            className={`flex items-center gap-2 text-sm underline font-medium hover:no-underline ${isOwn ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}>
            📎 {parsed.name}
          </a>
        );
      }
    } catch { /* not JSON */ }
    return <p className="break-words leading-relaxed">{message}</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md flex flex-col shadow-2xl" style={{ height: '480px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Message {candidateName}</h3>
              <p className="text-blue-100 text-xs">{candidateEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">×</button>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              ✓ {successMessage}
            </div>
          )}
          {fetchLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageCircle className="w-16 h-16 mb-3 text-gray-300" />
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="text-xs mt-1 text-gray-400">Send your first message to {candidateName}</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.senderId === employerId;
              const msgId = msg.id || msg._id || String(i);
              return (
                <div key={msgId} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}
                  onMouseEnter={() => isOwn && setHoveredMsgId(msgId)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  {isOwn && hoveredMsgId === msgId && (
                    <button
                      onClick={() => deleteMessage(msgId)}
                      className="self-center mr-1 p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl shadow-sm ${
                    isOwn ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}>
                    {!isOwn && (
                      <div className="text-xs font-semibold text-blue-600 mb-0.5">
                        {msg.senderName || 'Unknown'}
                        {msg.companyName ? ` · ${msg.companyName}` : ''}
                        {msg.senderEmail ? ` · ${msg.senderEmail}` : ''}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed">
                      {renderContent(msg.message, isOwn)}
                    </div>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'} text-right`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white rounded-b-xl">
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
              disabled={loading || !resolvedCandidateId}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !loading) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim() || !resolvedCandidateId}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
