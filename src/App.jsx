import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CommentProvider } from './context/CommentContext';
import AuthLayout from './components/layout/AuthLayout';
import CabinetLayout from './components/layout/CabinetLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Cabinet/Dashboard';

function App() {
  return (
    <AuthProvider>
      <CommentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/cabinet/dashboard" replace />} />
            
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            <Route path="/cabinet" element={<CabinetLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </CommentProvider>
    </AuthProvider>
  );
}

export default App;