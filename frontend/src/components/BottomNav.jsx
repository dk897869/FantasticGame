import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Flame, Gamepad2, Wallet, User } from 'lucide-react';

export const BottomNav = () => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Win Go', path: '/wingo', icon: Flame },
    { label: 'Arcade', path: '/mini-games', icon: Gamepad2 },
    { label: 'Wallet', path: '/deposit', icon: Wallet },
    { label: 'Account', path: '/profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/98 backdrop-blur-xl border-t border-slate-800/80 py-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-md mx-auto flex items-center justify-between px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 select-none ${
                  isActive
                    ? 'text-amber-400 font-extrabold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-2xl transition-all ${isActive ? 'bg-amber-400/15 shadow-sm shadow-amber-400/20' : ''}`}>
                    <Icon size={21} strokeWidth={isActive ? 2.6 : 2} />
                  </div>
                  <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'text-amber-300 font-black' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
