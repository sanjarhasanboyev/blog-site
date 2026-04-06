import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComments } from '../../context/CommentContext';
import { FiTrash2 } from 'react-icons/fi';
import api from '../../api/api';
import MentionDropdown from '../../components/mentions/MentionDropdown';

const Dashboard = () => {
  const { user } = useAuth();
  const { comments, loading, error, addComment, deleteComment, fetchComments } = useComments();
  const [text, setText] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchComments();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setAllUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setAllUsers([]); // Clear users on error
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setText(value);

    // Mention detection
    const lastAtPos = value.lastIndexOf('@', selectionStart - 1);
    if (lastAtPos !== -1) {
      const textAfterAt = value.substring(lastAtPos + 1, selectionStart);
      // Ensure there's no space between @ and the cursor
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        const filtered = allUsers.filter(u => 
          u.username.toLowerCase().includes(textAfterAt.toLowerCase()) || 
          u.name.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setFilteredUsers(filtered);
        setActiveIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (targetUser) => {
    const selectionStart = textareaRef.current.selectionStart;
    const lastAtPos = text.lastIndexOf('@', selectionStart - 1);
    
    const newText = 
      text.substring(0, lastAtPos) + 
      `@${targetUser.username} ` + 
      text.substring(selectionStart);
    
    setText(newText);
    setShowMentions(false);
    
    // Set focus back to textarea
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPos = lastAtPos + targetUser.username.length + 2; // +1 for @, +1 for space
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[activeIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const handlePost = async () => {
    if (text.trim() && user) {
      await addComment(text, user);
      setText('');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Yaqinda';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'Yaqinda' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = () => user?.user?.name || user?.name || 'User';
  const getUserUsername = () => user?.user?.username || user?.username || 'user';

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Create Post Section */}
      <div className={`bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom duration-500 relative ${showMentions ? 'z-50' : 'z-10'}`}>
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
              {getUserName().charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 pt-1 relative">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent resize-none text-gray-900 placeholder-gray-400 focus:outline-none text-base md:text-lg min-h-[60px]"
              placeholder="Fikringizni qoldiring..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
            />
            {showMentions && (
              <div className="absolute top-full left-0 mt-1">
                <MentionDropdown 
                  users={filteredUsers} 
                  activeIndex={activeIndex} 
                  onSelect={insertMention} 
                />
              </div>
            )}
            <div className="flex justify-end mt-2 pt-3 border-t border-gray-100">
              <button
                onClick={handlePost}
                disabled={!text.trim() || loading}
                className="px-6 py-2 bg-black text-white font-semibold rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Hali xabarlar yo'q. Birinchilardan bo'lib fikr qoldiring!
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id || Math.random()} 
              className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors relative group animate-in fade-in duration-300"
            >
              {(getUserUsername() === comment.username || getUserUsername() === comment.user?.username) && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-50 active:scale-95"
                  title="Fikrni o'chirish"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
              
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                    {(comment.user?.name || comment.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold text-gray-900">{comment.user?.name || comment.name || 'Unknown'}</span>
                    <span className="text-gray-500 text-sm">@{comment.user?.username || comment.username || 'user'}</span>
                    <span className="text-gray-400 text-sm hidden sm:inline">·</span>
                    <span className="text-gray-400 text-sm">{formatDate(comment.createdAt || comment.timestamp)}</span>
                  </div>
                  <p className="text-gray-800 text-[15px] leading-relaxed break-words pr-8 whitespace-pre-wrap">
                    {
                    comment.text.split(' ').map((word) => {
                      if (word.startsWith('@')) {
                        return <span key={word} className="text-blue-500 font-bold">{word + " "}</span>;
                      }
                      return word + " ";
                    })
                    }
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
