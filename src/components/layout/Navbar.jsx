import { useAuth } from '../../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-2xl font-extrabold tracking-tighter text-gray-900">
          Threads.
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-500 hidden sm:block">
            Welcome, <span className="text-gray-900 font-semibold">{user?.name}</span>
          </span>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            <FiLogOut size={18} />
            <span className="hidden sm:block">Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
