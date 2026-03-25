import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
      <div className="max-w-md w-full bg-white border border-gray-200 shadow-sm rounded-3xl p-8 transition-all animate-in fade-in zoom-in duration-500">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
