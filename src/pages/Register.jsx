import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError('Iltimos, barcha maydonlarni to`ldiring');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post("/auth/register", {
        name,
        username,
        password
      });

      console.log('Ro`yxatdan o`tish muvaffaqiyatli:', response.data);

      // Update the auth state with user data from backend
      loginSuccess(response.data);
      
      // Navigate to dashboard
      navigate('/cabinet/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Serverda xatolik. Iltimos qaytadan urinib ko`ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-2xl rounded-xl mb-6 shadow-sm">
        @
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Platformaga qo'shiling</h1>
      <p className="text-gray-500 text-center mb-8">Yangi hisobingizni yarating</p>

      {error && <div className="w-full text-red-500 font-medium text-sm text-center mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <input
            type="text"
            placeholder="To'liq ism"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm disabled:opacity-50"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm disabled:opacity-50"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm mt-2 flex items-center justify-center disabled:bg-gray-400"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ro'yxatdan o'tish...
            </span>
          ) : 'Ro\'yxatdan o\'tish'}
        </button>
      </form>
      
      <p className="mt-8 text-center text-gray-500 text-sm">
        Hisobingiz bormi?{' '}
        <Link to="/login" className="text-black font-semibold hover:underline">
          Kirish
        </Link>
      </p>
    </div>
  );
};

export default Register;
