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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800 py-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-amber-400/10' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[11px] mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
