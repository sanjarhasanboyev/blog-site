import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const CabinetLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
};

export default CabinetLayout;
