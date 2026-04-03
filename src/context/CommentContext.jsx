import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CommentContext = createContext();

export const useComments = () => useContext(CommentContext);

export const CommentProvider = ({ children }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://flexible-century-stunning-money.trycloudflare.com/comments");
      // The backend might return comments in a specific format, ensure it's an array
      setComments(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Fikrlarni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (text, user) => {
    if (!text.trim() || !user) return;

    try {
      // Assuming the backend expectation for the new comment structure
      const response = await axios.post("https://flexible-century-stunning-money.trycloudflare.com/comments", {
        name: user.user?.name || user.name,
        username: user.user?.username || user.username,
        text: text.trim()
      });

      // Update the local state with the new comment from the server response
      if (response.data) {
        setComments(prev => [response.data, ...prev]);
      } else {
        // Fallback: manually fetch if the post didn't return the new object
        fetchComments();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Fikr qoldirishda xatolik yuz berdi.");
    }
  };

  const deleteComment = async (id) => {
    // Note: This depends on whether the backend supports DELETE /comments/:id
    try {
      await axios.delete(`https://flexible-century-stunning-money.trycloudflare.com/comments/${id}`);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error deleting comment:", err);
      // Even if DELETE fails on server (maybe not implemented), we might want to keep local state for now
      // setComments(prev => prev.filter(c => c.id !== id)); 
    }
  };

  return (
    <CommentContext.Provider value={{ comments, loading, error, fetchComments, addComment, deleteComment }}>
      {children}
    </CommentContext.Provider>
  );
};
