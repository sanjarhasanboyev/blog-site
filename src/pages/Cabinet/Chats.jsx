import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiSearch, FiSend, FiMoreVertical, FiArrowLeft, FiMessageSquare, FiCheck, FiCopy, FiEdit2, FiTrash2, FiCornerUpRight } from 'react-icons/fi';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Picker from 'emoji-picker-react';
import { FiSmile } from 'react-icons/fi';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://offer-cooler-watt-seeds.trycloudflare.com';

const Chats = () => {
  const { user } = useAuth();
  const currentUser = user?.user || user; 

  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [socket, setSocket] = useState(null);
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);

  // Real-time states
  const [remoteTyping, setRemoteTyping] = useState({}); // { chatId: boolean }
  const typingTimeoutRef = useRef(null);

  const emojiPickerRef = useRef(null);
  const chatEndRef = useRef(null);
  const contextMenuRef = useRef(null);
  
  // 1. Ulanishni initsializatsiya qilish
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 0. TIZIMGA ULANISH
    if (currentUser?.id) {
      newSocket.emit("user_connected", currentUser.id);
    }

    return () => newSocket.close();
  }, [currentUser]);

  // 2. Ma'lumotlarni tortish
  useEffect(() => {
    if (currentUser?.id) {
      fetchInitialData();
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Ikkala malumotni parallel ham olish mumkin. Chats va barcha userlar.
      const [chatsRes, usersRes] = await Promise.all([
        api.get(`/chats/user/${currentUser.id}`),
        api.get('/auth/users').catch(() => ({ data: [] }))
      ]);

      setChats(chatsRes.data || []);
      setAllUsers(usersRes.data.filter(u => u.id !== currentUser.id && u.username !== currentUser.username) || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Socket Eventlarni tutish (Tarix va Holatlar aralashmasligi kerak)
  useEffect(() => {
    if (!socket) return;

    // Yangi xabar kelishi
    const handleReceiveMessage = (newMessage) => {
      // 1. Agar biz ushbu chat xonasida kirsak, xabarni ekranga qo'shamiz
      if (newMessage.chatId === activeChatId) {
        setMessages((prev) => [...prev, newMessage]);
        socket.emit("mark_as_read", { chatId: activeChatId, userId: currentUser.id });
      }

      // 2. Chap palendagi ro'yxatni (chats) yangilaymiz
      setChats(prevChats => {
        let chatExists = false;
        const newChats = prevChats.map(c => {
          if (c.id === newMessage.chatId) {
            chatExists = true;
            return {
              ...c,
              messages: [newMessage],
              unreadCount: (newMessage.chatId === activeChatId || newMessage.user?.id === currentUser.id || newMessage.userId === currentUser.id) 
                ? c.unreadCount 
                : (c.unreadCount || 0) + 1
            };
          }
          return c;
        });

        // Agar chat umuman topilmasa, API ga so'rov qilib chatlarni yangilab olish mumkin 
        // Yeki oddiygina qayta fetch qilsa bo'ladi. Hozircha qayta fetch qilib qoyamiz onsongina:
        if (!chatExists) {
          api.get(`/chats/user/${currentUser.id}`).then(res => setChats(res.data));
        }

        // Yangi xabar kelgan chatni birinchi o'ringa olib chiqamiz
        return newChats.sort((a,b) => {
          const timeA = new Date(a.messages?.[0]?.createdAt || 0).getTime();
          const timeB = new Date(b.messages?.[0]?.createdAt || 0).getTime();
          return timeB - timeA;
        });
      });
    };

    // Chatda xabarlar o'qilganda "✓✓" vizual holati kerak
    const handleMessagesRead = ({ chatId, readBy }) => {
      if (chatId === activeChatId && readBy !== currentUser.id) {
        setMessages(prev => prev.map(m => (!isMyMessage(m)) ? m : { ...m, isRead: true }));
      }
    };

    // Typing... (Kimdir yozayapti)
    const handleTyping = ({ chatId, userId }) => {
      if (userId !== currentUser.id) {
        setRemoteTyping(prev => ({ ...prev, [chatId]: true }));
      }
    };
    
    // Typing... To'xtadi
    const handleStopTyping = ({ chatId, userId }) => {
      if (userId !== currentUser.id) {
        setRemoteTyping(prev => ({ ...prev, [chatId]: false }));
      }
    };

    // Online Status o'zgarganda
    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      setChats(prev => prev.map(c => ({
        ...c,
        users: c.users?.map(u => u.id === userId ? { ...u, isOnline, lastSeen } : u)
      })));
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isOnline, lastSeen } : u));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    const handleMessageEdited = ({ messageId, newText }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m));
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("user_status", handleUserStatus);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_edited", handleMessageEdited);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("user_status", handleUserStatus);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_edited", handleMessageEdited);
    };
  }, [socket, activeChatId, currentUser]);


  // Oyna yopilganda va hokazo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  // Foydalnuvchini tanlaganimizda
  const openChatWithUser = async (targetUser) => {
    if (!socket) return;
    
    try {
      // Chat ID ni olish yoki yangi boshlash
      const chatRes = await api.post('/chats/start', { 
        userId1: currentUser.id, 
        userId2: targetUser.id 
      });
      const chat = chatRes.data;
      
      setActiveChatId(chat.id);
      
      // Xabarlarni chaqirish
      const msgsRes = await api.get(`/chats/${chat.id}/messages`);
      setMessages(msgsRes.data || []);
      
      // Xonaga qo'shilish & o'qilgan ro'yxatini yuborish
      socket.emit("join_chat", chat.id);
      socket.emit("mark_as_read", { chatId: chat.id, userId: currentUser.id });
      
      // Local chat ro'yxatidagi unread counts ni o'chiramiz:
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
      
    } catch (error) {
      console.error("Error setting up chat:", error);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeChatId || !socket) return;

    if (editingMessage) {
      socket.emit("edit_message", {
        chatId: activeChatId,
        messageId: editingMessage.id,
        newText: messageInput.trim()
      });
      setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text: messageInput.trim(), isEdited: true } : m));
      setEditingMessage(null);
    } else {
      socket.emit("send_message", {
        chatId: activeChatId,
        userId: currentUser.id,
        text: messageInput.trim()
      });
    }

    socket.emit("stop_typing", { chatId: activeChatId, userId: currentUser.id });

    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      msg: msg,
    });
  };

  const handleContextAction = (action) => {
    if (action === 'copy' && contextMenu?.msg?.text) {
      navigator.clipboard.writeText(contextMenu.msg.text);
    } else if (action === 'delete' && contextMenu?.msg) {
      socket.emit('delete_message', { chatId: activeChatId, messageId: contextMenu.msg.id });
      setMessages(prev => prev.filter(m => m.id !== contextMenu.msg.id));
    } else if (action === 'edit' && contextMenu?.msg) {
      setEditingMessage(contextMenu.msg);
      setMessageInput(contextMenu.msg.text);
    } else if (action === 'forward' && contextMenu?.msg) {
      setForwardingMessage(contextMenu.msg);
      setForwardModalOpen(true);
    }
    setContextMenu(null);
  };

  // Typing debounce logic
  const handleInputType = (e) => {
    setMessageInput(e.target.value);
    
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    if (activeChatId && socket) {
      socket.emit("typing", { chatId: activeChatId, userId: currentUser.id });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { chatId: activeChatId, userId: currentUser.id });
      }, 2000);
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
  };

  // Utils
  const isMyMessage = (msg) => (msg.user?.id === currentUser.id) || (msg.userId === currentUser.id);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatPartner = (chat) => {
    return chat.users?.find(u => u.id !== currentUser.id) || chat.users?.[0];
  };

  const activeChatPartner = chats.find(c => c.id === activeChatId) ? getChatPartner(chats.find(c => c.id === activeChatId)) : null;

  // Search logic: agar mavjud chatlar qidiruvdan chiqmasa, globalda izlash
  const q = searchQuery.toLowerCase();
  
  const displayChats = chats.filter(c => {
    const partner = getChatPartner(c);
    if (!partner) return false;
    return partner.name.toLowerCase().includes(q) || partner.username.toLowerCase().includes(q);
  }).sort((a, b) => {
    // Eng yangi chatlar tepadagi priority olsin
    const timeA = new Date(a.messages?.[0]?.createdAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.messages?.[0]?.createdAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const displayGlobalUsers = allUsers.filter(u => {
    // Faqat search ga to'g'ri kelsin va u odam displayChats da yo'q bo'lsin
    if (!q) return false; 
    const matches = u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    const inChats = chats.some(c => getChatPartner(c)?.username === u.username);
    return matches && !inChats;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-140px)] flex overflow-hidden w-full max-w-5xl mx-auto drop-shadow-sm">
      
      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-[350px] flex-shrink-0 border-r border-gray-100 flex flex-col bg-white ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chats</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Foydalanuvchilarni qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all text-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : (
            <>
              {displayChats.map(c => {
                const partner = getChatPartner(c);
                if (!partner) return null;
                const lastMsg = c.messages?.[0];
                const unread = c.unreadCount || 0;

                return (
                  <button
                    key={c.id}
                    onClick={() => openChatWithUser(partner)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-left ${activeChatId === c.id ? 'bg-black text-white shadow-md' : 'hover:bg-gray-50 bg-white text-gray-900'}`}
                  >
                    <div className="relative mr-3 flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${activeChatId === c.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {partner.name?.charAt(0).toUpperCase()}
                      </div>
                      {partner.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="overflow-hidden flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className={`font-semibold truncate pr-2 ${activeChatId === c.id ? 'text-white' : 'text-gray-900'}`}>
                          {partner.name}
                        </div>
                        {lastMsg && (
                          <div className={`text-[11px] flex-shrink-0 whitespace-nowrap ${activeChatId === c.id ? 'text-gray-300' : 'text-gray-400'}`}>
                            {formatTime(lastMsg.createdAt)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center h-5">
                        <div className={`text-sm truncate pr-2 ${activeChatId === c.id ? 'text-gray-300' : 'text-gray-500'}`}>
                          {remoteTyping[c.id] ? (
                            <span className="text-blue-500 animate-pulse font-medium">yozmoqda...</span>
                          ) : (
                            lastMsg ? lastMsg.text : `@${partner.username}`
                          )}
                        </div>
                        {unread > 0 && activeChatId !== c.id && (
                          <div className="flex-shrink-0 bg-red-500 text-white text-[11px] font-bold px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center">
                            {unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Gloabl Search Results */}
              {displayGlobalUsers.length > 0 && (
                <div className="pt-4 pb-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Boshqa foydalanuvchilar</div>
                  {displayGlobalUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => openChatWithUser(u)}
                      className="w-full flex items-center p-3 rounded-xl transition-all duration-200 text-left hover:bg-gray-50 bg-white text-gray-900"
                    >
                      <div className="relative mr-3 flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-800">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        {u.isOnline && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="font-semibold truncate text-gray-900">{u.name}</div>
                        <div className="text-sm truncate text-gray-500">@{u.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {displayChats.length === 0 && displayGlobalUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Foydalanuvchilar/Chatlar topilmadi
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT CONTENT */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#f8f9fa] backdrop-blur-sm">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
              <FiMessageSquare size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Chatni boshlash</h3>
            <p className="mt-2 text-sm max-w-sm text-center">Yangi suhbatni boshlash uchun chap panelda kimnidir tanlang.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 px-4 py-2 flex items-center justify-between bg-white z-10">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-3 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setActiveChatId(null)}
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-tr from-gray-800 to-black text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                    {activeChatPartner?.name?.charAt(0).toUpperCase()}
                  </div>
                  {activeChatPartner?.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="ml-3 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 leading-none mb-1">{activeChatPartner?.name}</h3>
                  <div className="text-[12px] font-medium min-h-[16px]">
                    {remoteTyping[activeChatId] ? (
                      <span className="text-blue-500 animate-pulse">yozmoqda...</span>
                    ) : (
                      activeChatPartner?.isOnline ? (
                        <span className="text-green-500">Online</span>
                      ) : (
                        <span className="text-gray-400">
                          {activeChatPartner?.lastSeen ? `Oxirgi marta: ${formatTime(activeChatPartner.lastSeen)}` : 'Offline'}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <FiMoreVertical size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 pb-6 overflow-y-auto bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-fixed">
              <div className="space-y-4 flex flex-col min-h-full justify-end">
                {messages.length === 0 && (
                  <div className="flex justify-center mb-8 flex-1 items-end mt-auto">
                    <div className="bg-white/80 backdrop-blur text-gray-600 px-4 py-2.5 rounded-2xl text-sm italic shadow-sm border border-gray-100/50">
                      Bu {activeChatPartner?.name} bilan xabarlar xonasi. Birinchi bo'lib yozishni boshlang!
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const itIsMe = isMyMessage(msg);
                  return (
                    <div key={msg.id || idx} className={`flex w-full ${itIsMe ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl shadow-sm relative group flex flex-col transition-colors cursor-pointer ${
                        itIsMe 
                          ? 'bg-black text-white rounded-br-none hover:bg-gray-900' 
                          : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none hover:bg-gray-50'
                      }`}>
                        <div className="text-[15px] leading-relaxed break-words pr-8">
                          {msg.isForwarded && (
                            <span className="block text-[11.5px] font-medium opacity-80 mb-1 border-l-2 border-current pl-1.5 italic">
                              Forwarded from {msg.originalAuthor || 'User'}
                            </span>
                          )}
                          <span>{msg.text}</span>
                          {msg.isEdited && <span className="text-[10px] opacity-70 ml-2 italic">(edited)</span>}
                        </div>
                        
                        <div className={`flex items-center self-end gap-1 mt-1 -mb-1 ${itIsMe ? 'text-gray-400' : 'text-gray-400'}`}>
                          <span className="text-[10px] leading-none opacity-80 whitespace-nowrap">
                            {formatTime(msg.createdAt)}
                          </span>
                          {itIsMe && (
                            <div className="flex items-center text-[10px]">
                               {msg.isRead ? <span className="text-blue-400">✓✓</span> : <span className="text-gray-400">✓</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 flex flex-col items-center">
              {editingMessage && (
                <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2.5 mb-3 rounded-xl border border-blue-100/50 w-full max-w-4xl mx-auto backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-blue-600 font-semibold text-[13px] flex items-center gap-1.5">
                      <FiEdit2 size={12} /> Tahrirlanmoqda
                    </span>
                    <span className="text-gray-500 text-sm truncate max-w-full italic mt-0.5">{editingMessage.text}</span>
                  </div>
                  <button type="button" onClick={() => { setEditingMessage(null); setMessageInput(''); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-500 transition-colors shrink-0 shadow-sm border border-gray-100">
                    ✕
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black/20 transition-all flex items-end relative overflow-visible">
                  
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-3 text-gray-400 hover:text-gray-700 rounded-bl-2xl transition-colors shrink-0"
                    >
                      <FiSmile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <div className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl overflow-hidden border border-gray-100 mb-2">
                          <Picker 
                            onEmojiClick={onEmojiClick} 
                            theme="light" 
                            width={320}
                            height={380}
                            searchPlaceHolder="Emoji qidirish..."
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={handleInputType}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Xabar yozing..."
                    className="flex-1 bg-transparent py-3 px-2 resize-none outline-none text-[15px] text-gray-900 max-h-[120px] custom-scrollbar"
                    style={{ minHeight: '44px' }}
                  />
                  <div className="p-1.5 shrink-0">
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-2.5 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 transition-all active:scale-95"
                    >
                      <FiSend size={18} className={messageInput.trim() ? "translate-x-[1px] -translate-y-[1px]" : ""} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Context Menu Modal */}
      {contextMenu && createPortal(
        <div 
          ref={contextMenuRef}
          style={{ 
            top: Math.min(contextMenu.mouseY, window.innerHeight - 220), 
            left: Math.min(contextMenu.mouseX, window.innerWidth - 200) 
          }}
          className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-48 overflow-hidden py-1.5 text-[15px] font-medium text-gray-700 animate-in fade-in zoom-in-95 duration-100"
        >
          <button 
            onClick={() => handleContextAction('forward')} 
            className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <FiCornerUpRight className="mr-3 text-gray-500" size={18} /> Forward
          </button>
          
          <button 
            onClick={() => handleContextAction('copy')} 
            className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
          >
            <FiCopy className="mr-3 text-gray-500" size={18} /> Copy
          </button>
          
          {contextMenu.msg && isMyMessage(contextMenu.msg) && (
            <button 
              onClick={() => handleContextAction('edit')} 
              className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <FiEdit2 className="mr-3 text-gray-500" size={18} /> Edit
            </button>
          )}
          
          {contextMenu.msg && isMyMessage(contextMenu.msg) && (
            <>
              <div className="h-[1px] bg-gray-100 my-1 w-full"></div>
              <button 
                onClick={() => handleContextAction('delete')} 
                className="w-full flex items-center px-4 py-2.5 hover:bg-red-50 text-red-500 transition-colors text-left"
              >
                <FiTrash2 className="mr-3 text-red-400" size={18} /> Delete
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* Forward Modal */}
      {forwardModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-lg text-gray-900">Forward qilish</h3>
              <button 
                onClick={() => { setForwardModalOpen(false); setForwardingMessage(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >✕</button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2 bg-white custom-scrollbar">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">Suhbatlar</div>
              {displayChats.map(c => {
                const partner = getChatPartner(c);
                if (!partner) return null;
                return (
                  <button
                    key={'fwd-'+c.id}
                    onClick={() => {
                      socket.emit("send_message", {
                        chatId: c.id,
                        userId: currentUser.id,
                        text: forwardingMessage.text,
                        isForwarded: true,
                        originalAuthor: forwardingMessage.user?.name || forwardingMessage.userId
                      });
                      setForwardModalOpen(false);
                      setForwardingMessage(null);
                    }}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-800 mr-3 shrink-0">
                      {partner.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium text-[15px] text-gray-900 truncate">{partner.name}</div>
                  </button>
                );
              })}
              {displayChats.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-6">Chatlar topilmadi.</div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Chats;
