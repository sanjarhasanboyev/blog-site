import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useComments } from '../../context/CommentContext';
import { FiTrash2 } from 'react-icons/fi';
import axios from 'axios';

const Dashboard = () => {
  const data = axios.get("https://about-administrative-nursery-family.trycloudflare.com/comments")
  .then(respose => console.log(respose.data))
  const { user } = useAuth();
  const { comments, addComment, deleteComment } = useComments();
  const [text, setText] = useState('');

  const handlePost = () => {
    
    if (text.trim()) {
      addComment(text, user);
      setText('');
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Create Post Section */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm mb-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 pt-1">
            <textarea
              className="w-full bg-transparent resize-none text-gray-900 placeholder-gray-400 focus:outline-none text-base md:text-lg min-h-[60px]"
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end mt-2 pt-3 border-t border-gray-100">
              <button
                onClick={handlePost}
                disabled={!text.trim()}
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
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors relative group"
          >
            {user?.username === comment.user.username && (
              <button
                onClick={() => deleteComment(comment.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-50 active:scale-95"
                title="Delete comment"
              >
                <FiTrash2 size={18} />
              </button>
            )}
            
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                  {comment.user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                  <span className="font-bold text-gray-900">{comment.user.name}</span>
                  <span className="text-gray-500 text-sm">@{comment.user.username}</span>
                  <span className="text-gray-400 text-sm hidden sm:inline">·</span>
                  <span className="text-gray-400 text-sm">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-800 text-[15px] leading-relaxed break-words pr-8 whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            No posts yet. Be the first to share!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
