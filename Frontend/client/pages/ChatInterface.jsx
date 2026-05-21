import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/apiService.jsx';
import { socketService } from '../services/socketService.jsx';

export default function ChatInterface() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(!conversationId);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const loadedConversationRef = useRef(null);
  const conversationsCacheRef = useRef([]);
  const messagesCacheRef = useRef(new Map());

  // When route is `/chat` there is no `conversationId` param, so we use the selected
  // conversation id instead (otherwise sending is blocked).
  const activeConversationId = conversationId || currentConversation?._id || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await api.chats.getConversations();
      const sorted = [...(response.conversations || [])].sort(
        (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
      );
      setConversations(sorted);
      conversationsCacheRef.current = sorted;
      sessionStorage.setItem('chat_conversations_cache', JSON.stringify(sorted));
    } catch (err) {
      setError(err.message);
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const response = await api.chats.getMessages(convId);
      const nextMessages = response.messages || [];
      setMessages(nextMessages);
      messagesCacheRef.current.set(convId, nextMessages);
      await api.chats.markConversationAsRead(convId);
      socketService.emitConversationRead(convId, user.id);
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    // Fast paint from cached conversations, then refresh in background.
    try {
      const raw = sessionStorage.getItem('chat_conversations_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          conversationsCacheRef.current = parsed;
          setLoading(false);
        }
      }
    } catch {
      // ignore cache parse issues
    }

    loadConversations();
    if (user) {
      socketService.connect(user.id);
    }
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (conversations.length === 0) return;

    // If URL has a conversation id, prefer that.
    if (conversationId) {
      const conv = conversations.find((c) => c._id === conversationId);
      if (!conv) return;
      setCurrentConversation(conv);
      if (loadedConversationRef.current !== conversationId) {
        const cached = messagesCacheRef.current.get(conversationId);
        if (cached) setMessages(cached);
        loadMessages(conversationId);
        socketService.joinConversation(conversationId);
        loadedConversationRef.current = conversationId;
      }
      setShowMobileSidebar(false);
      return;
    }

    // If URL is `/chat` (no param), auto-select the first conversation.
    // This lets the user send messages without needing to click the sidebar first.
    if (!currentConversation?._id) {
      const first = conversations[0];
      if (!first) return;
      setCurrentConversation(first);
      if (loadedConversationRef.current !== first._id) {
        const cached = messagesCacheRef.current.get(first._id);
        if (cached) setMessages(cached);
        loadMessages(first._id);
        socketService.joinConversation(first._id);
        loadedConversationRef.current = first._id;
      }
      setShowMobileSidebar(false);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    const handleMessageReceived = (data) => {
      setConversations((prev) => {
        const next = prev.map((conv) => {
          if (conv._id !== data.conversationId) return conv;
          const isIncoming = data.senderId !== user.id;
          const incrementUnread = isIncoming && data.conversationId !== activeConversationId;
          return {
            ...conv,
            lastMessage: data.text,
            lastMessageSenderId: data.senderId,
            lastMessageAt: data.createdAt || data.timestamp || new Date().toISOString(),
            unreadCount: incrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0,
          };
        });
        return [...next].sort(
          (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
        );
      });

      if (data.conversationId === activeConversationId) {
        setMessages((prev) => {
          const withoutTemp = data.clientTempId
            ? prev.filter((m) => m._id !== data.clientTempId)
            : prev;
          const next = [
            ...withoutTemp.filter((m) => (data._id ? m._id !== data._id : true)),
            {
              _id: data._id || new Date().getTime().toString(),
              conversationId: data.conversationId,
              senderId: data.senderId,
              text: data.text,
              createdAt: data.createdAt || data.timestamp,
              readBy: data.readBy || [],
              isRead: false,
            },
          ];
          messagesCacheRef.current.set(activeConversationId, next);
          return next;
        });
      }
    };

    const handleConversationUpdated = (data) => {
      setConversations((prev) => {
        const next = prev.map((conv) => {
          if (conv._id !== data.conversationId) return conv;
          return {
            ...conv,
            lastMessage: data.lastMessage || conv.lastMessage,
            lastMessageSenderId: data.lastMessageSenderId || conv.lastMessageSenderId,
            lastMessageAt: data.lastMessageAt || conv.lastMessageAt,
          };
        });
        return [...next].sort(
          (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
        );
      });
    };

    const handleUserTyping = (data) => {
      if (data.isTyping && data.userId !== user.id) {
        setTypingUser(data.userId);
      } else {
        setTypingUser(null);
      }
    };

    const handleReadReceipt = (data) => {
      if (!data || data.conversationId !== activeConversationId) return;
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.senderId !== user.id) return msg;
          const already = (msg.readBy || []).some((rb) => rb.userId === data.userId);
          if (already) return msg;
          return {
            ...msg,
            readBy: [...(msg.readBy || []), { userId: data.userId, readAt: data.readAt }],
          };
        })
      );
    };

    socketService.onMessageReceived(handleMessageReceived);
    socketService.onConversationUpdated(handleConversationUpdated);
    socketService.onUserTyping(handleUserTyping);
    socketService.onReadReceipt(handleReadReceipt);

    return () => {
      socketService.offMessageReceived();
      socketService.offConversationUpdated();
      socketService.offUserTyping();
      socketService.offReadReceipt();
    };
  }, [activeConversationId, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId) return;

    try {
      setSendingMessage(true);
      const textToSend = messageInput.trim();
      const tempId = `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const optimistic = {
        _id: tempId,
        conversationId: activeConversationId,
        senderId: user.id,
        text: textToSend,
        createdAt: new Date().toISOString(),
        readBy: [{ userId: user.id, readAt: new Date().toISOString() }],
        isRead: false,
      };
      setMessages((prev) => {
        const next = [...prev, optimistic];
        messagesCacheRef.current.set(activeConversationId, next);
        return next;
      });
      setConversations((prev) =>
        [...prev.map((c) => (c._id === activeConversationId
          ? {
              ...c,
              lastMessage: textToSend,
              lastMessageSenderId: user.id,
              lastMessageAt: optimistic.createdAt,
            }
          : c))].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
      );

      await api.chats.sendMessage(activeConversationId, textToSend);
      socketService.sendMessage(activeConversationId, user.id, textToSend, tempId);
      setMessageInput('');
      setIsTyping(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      socketService.emitTyping(activeConversationId, user.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emitTyping(activeConversationId, user.id, false);
    }, 2000);
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return null;
    return conversation.participants.find(p => p._id !== user.id);
  };

  const otherParticipant = currentConversation ? getOtherParticipant(currentConversation) : null;
  const otherParticipantId = otherParticipant?._id || null;

  const getReadStatusLabel = (msg) => {
    if (!msg || msg.senderId !== user.id) return '';
    const seenByOther = (msg.readBy || []).some((rb) => rb.userId === otherParticipantId);
    return seenByOther ? 'Seen' : 'Sent';
  };

  return (
    <div className="h-[72vh] min-h-[520px] bg-white flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-200">
      {/* Sidebar - Conversations List */}
      <div
        className={`${
          showMobileSidebar ? 'block' : 'hidden'
        } sm:block sm:w-80 bg-white border-r border-slate-200 flex flex-col h-full absolute sm:relative z-50 sm:z-0 w-full`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Messages</h2>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="sm:hidden text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {user?.role === 'alumni' ? 'Direct conversations with mentees' : 'Direct conversations with mentors'}
          </p>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-400">
              <i className="fas fa-spinner animate-spin mr-2"></i>
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <i className="fas fa-inbox text-3xl sm:text-4xl text-slate-300 mb-3"></i>
              <p className="text-slate-500 font-bold text-sm sm:text-base mb-2">No active conversations</p>
              <p className="text-xs sm:text-sm text-slate-400 mb-4">Your accepted requests will appear here</p>
              <button
                onClick={() => navigate(user?.role === 'student' ? '/mentors' : '/requests')}
                className="btn-primary text-xs sm:text-sm w-full"
              >
                <i className="fas fa-compass mr-2"></i>
                {user?.role === 'student' ? 'Find an Alumni Mentor' : 'Review Student Requests'}
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = conv._id === activeConversationId;
              const lastPrefix =
                conv.lastMessageSenderId && conv.lastMessageSenderId === user.id ? 'You: ' : '';
              return (
                <button
                  key={conv._id}
                  onClick={() => {
                    navigate(`/chat/${conv._id}`);
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full p-3 sm:p-4 border-b border-slate-100 transition-colors text-left hover:bg-slate-50 ${
                    isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={other?.profilePicture || 'https://via.placeholder.com/48'}
                      alt={other?.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{other?.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-1 pr-2">
                        {conv.lastMessage
                          ? `${lastPrefix}${conv.lastMessage.substring(0, 30)}...`
                          : 'No messages yet'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && conv._id !== activeConversationId && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {currentConversation && otherParticipant ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="sm:hidden text-indigo-600 font-bold"
                >
                  <i className="fas fa-bars"></i>
                </button>
                <img
                  src={otherParticipant.profilePicture || 'https://via.placeholder.com/48'}
                  alt={otherParticipant.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{otherParticipant.name}</p>
                  <p className="text-xs text-slate-500">Online</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gradient-to-b from-white to-slate-50 p-4 sm:p-6 space-y-4 sm:space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-comments text-4xl sm:text-5xl text-slate-300 mb-4"></i>
                    <p className="text-slate-500 font-bold text-sm sm:text-base mb-2">Start a conversation</p>
                    <p className="text-xs sm:text-sm text-slate-400">Send a message to connect with {otherParticipant.name}</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isSentByUser = msg.senderId === user.id;
                    const receipt = getReadStatusLabel(msg);
                    return (
                      <div key={msg._id} className={`flex ${isSentByUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-sm sm:text-base ${
                            isSentByUser
                              ? 'bg-indigo-600 text-white text-shadow-indigo shadow-indigo-500/30 rounded-br-none'
                              : 'bg-slate-200 text-slate-900 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <div className="text-xs mt-2 opacity-70 flex items-center justify-end gap-2">
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isSentByUser && (
                              <span className="font-semibold">
                                {receipt === 'Seen' ? (
                                  <span className="inline-flex items-center gap-1">
                                    <i className="fas fa-check-double" />
                                    Seen
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1">
                                    <i className="fas fa-check" />
                                    Sent
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {typingUser && (
                    <div className="flex justify-start">
                      <div className="bg-slate-200 text-slate-600 px-4 py-3 rounded-2xl rounded-bl-none">
                        <p className="text-sm font-semibold">
                          {otherParticipant.name} is typing
                          <span className="animate-bounce ml-1">.</span>
                          <span className="animate-bounce ml-1" style={{ animationDelay: '0.1s' }}>.</span>
                          <span className="animate-bounce ml-1" style={{ animationDelay: '0.2s' }}>.</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-slate-200 p-4 sm:p-6 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 input-field text-sm"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendingMessage || !activeConversationId}
                  className="px-4 sm:px-6 py-3 bg-indigo-600 text-white text-shadow-indigo font-bold rounded-xl hover:bg-indigo-800 hover:shadow-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {sendingMessage ? (
                    <i className="fas fa-spinner animate-spin"></i>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane hidden sm:inline"></i>
                      <span className="sm:hidden">Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <i className="fas fa-comments text-5xl sm:text-6xl text-slate-300 mb-4"></i>
              <p className="text-lg sm:text-2xl font-bold text-slate-400 mb-2">No conversation selected</p>
              <p className="text-sm sm:text-base text-slate-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}