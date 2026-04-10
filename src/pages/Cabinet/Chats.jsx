import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiSend, FiMoreVertical, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Picker from 'emoji-picker-react';
import { FiSmile } from 'react-icons/fi';
import { io } from 'socket.io-client';

// Ulanish uchun Backend manzili. (api.js dagi bilan bir xil)
const SOCKET_URL = 'https://highway-illustration-sought-released.trycloudflare.com';

const Chats = () => {
  const { user } = useAuth();
  const currentUser = user?.user || user; // Normalizing user info

  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [socket, setSocket] = useState(null);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // Initialize Socket Connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Fetch users list
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      // Exclude current user from the list
      const others = response.data.filter(u => u.username !== currentUser.username);
      setAllUsers(others);
      setFilteredUsers(others);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search filtering
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredUsers(allUsers.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.name.toLowerCase().includes(q)
    ));
  }, [searchQuery, allUsers]);

  // Click outside listener for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Socket & Chat Initialization Logic
  useEffect(() => {
    if (!socket || !activeChat) return;

    // 1-QADAM: Chat xonasiga qo'shilish
    socket.emit("join_chat", activeChat.id);

    // 2-QADAM: Boshqalar yozgan xabarni kutish va tutib olish
    const handleReceiveMessage = (newMessage) => {
      if (newMessage.chatId === activeChat.id || !newMessage.chatId) { // Fallback if backend doesn't send chatId
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, activeChat]);

  // Handle selecting a user from the sidebar
  const handleSelectUser = async (targetUser) => {
    setSelectedUser(targetUser);
    setActiveChat(null);
    setMessages([]);
    
    try {
      // 1-bosqich: Eskisini topish yoki Yangi chat ochish
      const chatRes = await api.post('/chats/start', { 
        userId1: currentUser.id, 
        userId2: targetUser.id 
      });
      const chat = chatRes.data;
      setActiveChat(chat);
      
      // 2-bosqich: Xabarlar tarixini yuklash (Chat ichi)
      const msgsRes = await api.get(`/chats/${chat.id}/messages`);
      setMessages(msgsRes.data || []);
      
    } catch (error) {
      console.error("Error setting up chat:", error);
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeChat || !socket) return;

    const text = messageInput.trim();
    
    // Optimistik holda xabarni qo'shish (ixtiyoriy, agar backend o'zimizga qaytarmasa)
    // Lekin TZ ga ko'ra "receive_message" kelishi kutiladi. 
    // Shuning uchun bu yerda faqat backendga yuboramiz.
    
    socket.emit("send_message", {
      chatId: activeChat.id,
      userId: currentUser.id,
      text: text
    });

    setMessageInput('');
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Hozir';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? 'Hozir' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to check if the message belongs to the current user
  const isMyMessage = (msg) => {
    return (msg.user?.id === currentUser.id) || (msg.userId === currentUser.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-140px)] flex overflow-hidden w-full max-w-5xl mx-auto drop-shadow-sm">
      
      {/* Left Sidebar (User List) */}
      <div className={`w-full md:w-[350px] flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chats</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Foydalanuvchilarni qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-gray-300 focus:ring-0 transition-all text-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Foydalanuvchilar topilmadi
            </div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.username}
                onClick={() => handleSelectUser(u)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-left ${selectedUser?.username === u.username ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 bg-transparent text-gray-900'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 transition-colors ${selectedUser?.username === u.username ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden flex-1">
                  <div className={`font-semibold truncate ${selectedUser?.username === u.username ? 'text-white' : 'text-gray-900'}`}>
                    {u.name}
                  </div>
                  <div className={`text-sm truncate ${selectedUser?.username === u.username ? 'text-gray-300' : 'text-gray-500'}`}>
                    @{u.username}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Content (Chat Area) */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <FiMessageSquare size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Chatni boshlash</h3>
            <p className="mt-2 text-sm max-w-sm text-center">Yangi suhbatni boshlash uchun chap panelda kimnidir tanlang.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 px-4 py-2 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-3 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setSelectedUser(null)}
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-gradient-to-tr from-gray-800 to-black text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h3 className="font-bold text-gray-900 leading-tight">{selectedUser.name}</h3>
                  <span className="text-xs text-green-500 font-medium">Chat faol</span>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <FiMoreVertical size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#fafafa]">
              <div className="space-y-6 flex flex-col">
                <div className="text-center text-xs text-gray-400 font-medium my-4">XABARLAR TARIXI</div>
                
                {!activeChat && (
                  <div className="flex justify-center mb-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                  </div>
                )}

                {activeChat && messages.length === 0 && (
                  <div className="flex justify-center mb-8">
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-2xl text-sm italic">
                      Bu {selectedUser.name} bilan xabarlar xonasi. Birinchi bo'lib yozishni boshlang!
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const itIsMe = isMyMessage(msg);
                  return (
                    <div key={msg.id || idx} className={`flex max-w-[75%] ${itIsMe ? 'self-end' : 'self-start'}`}>
                      <div className={`p-3.5 rounded-2xl shadow-sm relative group ${
                        itIsMe 
                          ? 'bg-black text-white rounded-br-none' 
                          : 'bg-white border border-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                        <span className={`text-[10px] absolute -bottom-5 right-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${itIsMe ? 'text-gray-500' : 'text-gray-400 left-1 right-auto'}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all flex items-end relative overflow-visible">
                  
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
                        <div className="shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden border border-gray-100">
                          <Picker 
                            onEmojiClick={onEmojiClick} 
                            theme="light" 
                            width={320}
                            height={400}
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
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
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
                  <div className="p-2 shrink-0">
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || !activeChat}
                      className="p-2 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 transition-all active:scale-95"
                    >
                      <FiSend size={18} className={messageInput.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default Chats;
