import { createContext, useState, useContext } from 'react';

const CommentContext = createContext();

export const useComments = () => useContext(CommentContext);

export const CommentProvider = ({ children }) => {
  const [comments, setComments] = useState(() => {
    const storedComments = localStorage.getItem('commentsDb');
    if (storedComments) {
      try {
        const parsed = JSON.parse(storedComments);
        // Normalize old data format to new format
        return parsed.map(c => ({
          ...c,
          user: c.user || { name: c.userName || 'Unknown', username: 'user' },
          createdAt: c.createdAt || c.timestamp || new Date().toISOString()
        }));
      } catch (e) {
        return [];
      }
    }
    
    const initial = [
      { 
        id: '1', 
        user: { name: 'Admin', username: 'admin' }, 
        text: 'Minimalistik platformamizga xush kelibsiz! Fikringizni qoldiring.', 
        createdAt: new Date().toISOString() 
      }
    ];
    localStorage.setItem('commentsDb', JSON.stringify(initial));
    return initial;
  });

  const addComment = (text, user) => {
    if (!text.trim() || !user) return;
    
    const newComment = {
      id: Date.now().toString(),
      user: { name: user.name, username: user.username },
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    
    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem('commentsDb', JSON.stringify(updated));
  };

  const deleteComment = (id) => {
    const updated = comments.filter(c => c.id !== id);
    setComments(updated);
    localStorage.setItem('commentsDb', JSON.stringify(updated));
  };

  return (
    <CommentContext.Provider value={{ comments, addComment, deleteComment }}>
      {children}
    </CommentContext.Provider>
  );
};
