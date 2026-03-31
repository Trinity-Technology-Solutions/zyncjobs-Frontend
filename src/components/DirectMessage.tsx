import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Send, X, MessageCircle } from 'lucide-react';

interface DirectMessageProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  employerId: string;
  employerName: string;
  onClose: () => void;
}

const DirectMessage: React.FC<DirectMessageProps> = ({ 
  candidateId, 
  candidateName, 
  candidateEmail,
  employerId,
  employerName,
  onClose 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const conversationId = [employerId, candidateId].sort().join('_');

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      } else if (response.status === 404) {
        setMessages([]);
      } else {
        setError('Failed to load messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Error loading messages');
    } finally {
      setFetchLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!candidateId || !employerId) {
      setError('Invalid candidate or employer ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: employerId,
          receiverId: candidateId,
          senderName: employerName,
          receiverName: candidateName,
          receiverEmail: candidateEmail,
          message: newMessage,
          conversationId
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        setSuccessMessage('Message sent!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold">Message {candidateName}</h3>
              <p className="text-sm text-gray-500">{candidateEmail}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
              {successMessage}
            </div>
          )}
          {fetchLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Start a conversation</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id || Math.random()}
                className={`flex ${msg.senderId === employerId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.senderId === employerId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderId === employerId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Just now'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim() || !candidateId}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
