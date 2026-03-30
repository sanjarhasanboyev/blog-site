import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Register = () => {

  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = (e) => {
    axios.post("https://about-administrative-nursery-family.trycloudflare.com/auth/register", {
      name,
      username,
      password
    })
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    })
    e.preventDefault();
    if (!name || !username || !password) {
      setError('Please fill in all fields'); return;
    }
    const res = register(name, username, password);
    if (res.success) navigate('/cabinet/dashboard');
    else setError(res.message);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-2xl rounded-xl mb-6 shadow-sm">
        @
      </div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Join Platform</h1>
      <p className="text-gray-500 text-center mb-8">Create your new account</p>

      {error && <div className="w-full text-red-500 font-medium text-sm text-center mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-sm mt-2"
        >
          Sign Up
        </button>
      </form>
      
      <p className="mt-8 text-center text-gray-500 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-black font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Register;
