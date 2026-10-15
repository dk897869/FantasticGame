import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Plus, ShieldCheck, User as UserIcon, LogIn } from 'lucide-react';

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-black text-xl">
            FG
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 leading-tight">
              FANTASTIC
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase -mt-0.5">
              WIN & PLAY
            </span>
          </div>
        </Link>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Balance Pill */}
              <div 
                onClick={() => navigate('/deposit')}
                className="cursor-pointer flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 rounded-full pl-2.5 pr-1 py-1 transition-all active:scale-95"
              >
                <span className="text-amber-400 font-bold text-sm">
                  ₹{Number(user.balance || 0).toLocaleString('en-IN')}
                </span>
                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-black">
                  <Plus size={13} strokeWidth={3} />
                </div>
              </div>


              {/* Profile Avatar */}
              <Link to="/profile" className="w-8 h-8 rounded-full border border-slate-700 overflow-hidden bg-slate-800">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user._id}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95"
            >
              <LogIn size={14} strokeWidth={2.5} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
