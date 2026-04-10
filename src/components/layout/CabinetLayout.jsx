import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const CabinetLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />
      <div className="max-w-[1200px] w-full mx-auto flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 px-4 py-8 mx-auto w-full animate-in fade-in duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CabinetLayout;
