/**
 * Admin Chat Inbox Page
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Search, Send, Loader2, Calendar, Link as LinkIcon } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/components/providers/AuthContext';
import { cn } from '@/lib/utils';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ChatInbox() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [otherUserTyping, setOtherUserTyping] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Fetch conversations list
    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            if (res.data.success) {
                setConversations(res.data.conversations);
            }
        } catch (error) {
            console.error('[Chat] Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    // Socket Connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket']
        });

        socketRef.current.on('chat:message', (message) => {
            // If the message is for the currently selected conversation, append it
            if (selectedConv && message.conversation_id === selectedConv.id) {
                setMessages(prev => [...prev, message]);
            }
            // Refresh conversation list to update last message
            fetchConversations();
        });

        socketRef.current.on('chat:typing_update', (data) => {
            if (selectedConv && data.conversationId === selectedConv.id) {
                setOtherUserTyping(data.isTyping);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [selectedConv]);

    // Handle Conversation Selection
    const selectConversation = async (conv) => {
        setSelectedConv(conv);
        setHistoryLoading(true);
        setMessages([]);
        setOtherUserTyping(false);

        try {
            const res = await api.get(`/chat/history/${conv.id}`);
            if (res.data.success) {
                setMessages(res.data.messages);
            }
            // Join room
            socketRef.current?.emit('chat:join', { conversationId: conv.id, tenantId: conv.tenant_id });
        } catch (error) {
            console.error('[Chat] Failed to fetch history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConv) return;

        try {
            await api.post('/chat/send', {
                conversationId: selectedConv.id,
                content: messageInput,
                type: 'text'
            });
            setMessageInput('');
        } catch (error) {
            console.error('[Chat] Failed to send message:', error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden relative">
            {/* Conversations Sidebar */}
            <div className={cn(
                "w-full md:w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/20 transition-all duration-300",
                selectedConv ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            Inbox
                        </h2>
                        {conversations.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest">
                                {conversations.length} Active
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-10 flex flex-col items-center justify-center text-gray-400 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Loading Chats...</p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={cn(
                                    "w-full text-left p-4 hover:bg-white transition-all flex gap-3 group relative",
                                    selectedConv?.id === conv.id ? "bg-white" : "bg-transparent"
                                )}
                            >
                                {selectedConv?.id === conv.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                                )}
                                <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-none group-hover:border-blue-100 transition-colors">
                                    {conv.context_image ? (
                                        <img src={conv.context_image} alt="Context" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <p className="font-bold text-sm text-gray-900 truncate tracking-tight">
                                            {conv.other_user_name || 'Anonymous User'}
                                        </p>
                                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                                            {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                                            {conv.context_data || (conv.type === 'product' ? 'Product' : 'Order')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate font-medium flex items-center gap-1">
                                        {conv.last_message || 'Start the conversation...'}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Content Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-white transition-all duration-300",
                !selectedConv ? "hidden md:flex" : "flex"
            )}>
                {selectedConv ? (
                    <>
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <button
                                    onClick={() => setSelectedConv(null)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>

                                <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-gray-900 truncate">
                                        {selectedConv.other_user_name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold">
                                        <span className="text-blue-600 uppercase tracking-widest">{selectedConv.context_data}</span>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <span className="text-gray-400 uppercase tracking-tight">Ref: #{selectedConv.reference_id?.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-all shadow-none hidden sm:block"
                                onClick={() => {/* Context action */ }}
                            >
                                {selectedConv.type === 'product' ? 'View Product' : 'View Order'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/20">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Fetching History...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.is_me || (user && msg.sender_id === user.id);
                                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                        const showAvatar = !isMe && (!prevMsg || (prevMsg.is_me || prevMsg.sender_id !== msg.sender_id));

                                        return (
                                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                                                <div className={cn(
                                                    "max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-[13px] md:text-sm shadow-none transition-all",
                                                    isMe
                                                        ? 'bg-blue-600 text-white rounded-br-none font-medium'
                                                        : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none font-medium'
                                                )}>
                                                    {msg.content}
                                                    <div className={cn(
                                                        "text-[9px] mt-1 font-bold uppercase tracking-tighter opacity-70",
                                                        isMe ? 'text-blue-100' : 'text-gray-400'
                                                    )}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {otherUserTyping && (
                                <div className="flex justify-start animate-pulse">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-none">
                                        Typing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!messageInput.trim()}
                                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-30 transition-all shadow-none group"
                            >
                                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/10 p-10 text-center">
                        <div className="w-20 h-20 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-center justify-center mb-6">
                            <MessageSquare className="w-10 h-10 text-blue-200" />
                        </div>
                        <h3 className="text-gray-900 font-black text-lg mb-2">Select a Conversation</h3>
                        <p className="text-xs font-bold uppercase tracking-widest max-w-[240px] leading-relaxed">
                            Pick a chat from the sidebar to view details and reply to customers
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
