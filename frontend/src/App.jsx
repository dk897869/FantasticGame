import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { WinGoGame } from './pages/WinGoGame';
import { MiniGames } from './pages/MiniGames';
import { Deposit } from './pages/Deposit';
import { Withdraw } from './pages/Withdraw';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';

function HashRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const targetPath = window.location.hash.replace('#', '');
      window.location.hash = '';
      navigate(targetPath, { replace: true });
    }
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <HashRedirect />
          <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/wingo" element={<WinGoGame />} />
                <Route path="/mini-games" element={<MiniGames />} />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
