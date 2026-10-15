import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, 
  Gamepad2, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Gift, 
  Share2, 
  Volume2,
  DollarSign
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const [winnerIndex, setWinnerIndex] = useState(0);

  // Dynamic live winning ticker simulating real-time player wins
  const winners = [
    { phone: '98***124', amount: '₹1,960', game: 'Win Go 1M' },
    { phone: '87***901', amount: '₹4,500', game: 'Lucky Wheel' },
    { phone: '70***452', amount: '₹9,800', game: 'Aviator Crash' },
    { phone: '91***637', amount: '₹890', game: '7 Up 7 Down' },
    { phone: '99***328', amount: '₹14,200', game: 'Win Go Red' },
    { phone: '84***519', amount: '₹3,400', game: 'Dice Roll' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setWinnerIndex((prev) => (prev + 1) % winners.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 p-4 shadow-xl text-black">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 text-black text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={12} />
            <span>Welcome Bonus ₹50 Free</span>
          </div>
          <h1 className="text-2xl font-black leading-tight drop-shadow-sm">
            INDIA'S FASTEST <br />COLOR PREDICTION
          </h1>
          <p className="text-xs font-semibold text-black/80 mt-1">
            Instant UPI deposits & 5-minute fast withdrawals 24/7!
          </p>

          <div className="mt-3 flex gap-2">
            <Link
              to="/wingo"
              className="px-4 py-2 rounded-xl bg-black text-amber-400 font-extrabold text-xs flex items-center gap-1 shadow-lg active:scale-95 transition-transform"
            >
              <Flame size={14} />
              <span>PLAY WIN GO</span>
            </Link>
            <Link
              to="/deposit"
              className="px-3.5 py-2 rounded-xl bg-white/30 backdrop-blur-sm text-black font-extrabold text-xs flex items-center gap-1 hover:bg-white/40 active:scale-95 transition-transform"
            >
              <span>DEPOSIT</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-4 -bottom-6 w-32 h-32 bg-yellow-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-2 top-2 text-6xl opacity-20 pointer-events-none">
          🎲
        </div>
      </div>

      {/* Marquee Notice Bar */}
      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs">
        <Volume2 size={16} className="text-amber-400 shrink-0 animate-pulse" />
        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-[marquee_18s_linear_infinite] text-slate-300 font-medium">
            🔥 Welcome to FantasticGame! Instant deposits via PhonePe, Google Pay, Paytm, BHIM and Navi • 100% Secure & Fast UTR verification!
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <Link
          to="/deposit"
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign size={20} />
          </div>
          <span className="text-[11px] font-bold text-slate-300">Deposit</span>
        </Link>

        <Link
          to="/withdraw"
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
          <span className="text-[11px] font-bold text-slate-300">Withdraw</span>
        </Link>

        <Link
          to="/profile"
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Share2 size={20} />
          </div>
          <span className="text-[11px] font-bold text-slate-300">Invite & Earn</span>
        </Link>

        <Link
          to="/profile"
          className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Gift size={20} />
          </div>
          <span className="text-[11px] font-bold text-slate-300">VIP Bonus</span>
        </Link>
      </div>

      {/* Main Game Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <Flame size={18} className="text-amber-400" />
            <span>Popular Games</span>
          </h2>
          <span className="text-xs text-slate-400">All Games Available</span>
        </div>

        {/* Win Go Card */}
        <Link
          to="/wingo"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 p-4 transition-all hover:border-amber-500/60 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Every 1 Min
              </div>
              <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                WIN GO COLOR PREDICTION
              </h3>
              <p className="text-xs text-slate-400">
                Green, Red, Violet & Numbers 0-9 • 2x to 9x Payouts
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 shrink-0">
              🎯
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              🟢 Green (2x)
            </span>
            <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
              🟣 Violet (4.5x)
            </span>
            <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
              🔴 Red (2x)
            </span>
          </div>
        </Link>

        {/* Grid for Aviator & Lucky Wheel */}
        <div className="grid grid-cols-2 gap-3">
          {/* Aviator Crash */}
          <Link
            to="/mini-games?game=aviator"
            className="group relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 p-3.5 transition-all active:scale-95"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🚀</span>
              <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                HOT
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white group-hover:text-rose-400">
              Aviator Crash
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cashout before blast! Up to 100x multiplier.
            </p>
          </Link>

          {/* Lucky Wheel */}
          <Link
            to="/mini-games?game=wheel"
            className="group relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 p-3.5 transition-all active:scale-95"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎡</span>
              <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                SPIN
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white group-hover:text-purple-400">
              Lucky Wheel
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Spin & win instant multipliers up to 10x!
            </p>
          </Link>

          {/* 7 Up 7 Down Dice */}
          <Link
            to="/mini-games?game=dice"
            className="group relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 p-3.5 transition-all active:scale-95"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎲</span>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                DICE
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white group-hover:text-blue-400">
              7 Up 7 Down
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Classic dice roll. Pick Up, Down, or Exact 7.
            </p>
          </Link>

          {/* Mines Arcade */}
          <Link
            to="/mini-games?game=mines"
            className="group relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 p-3.5 transition-all active:scale-95"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💎</span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                NEW
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white group-hover:text-emerald-400">
              Diamond Mines
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Uncover gems and avoid mines to multiply!
            </p>
          </Link>
        </div>
      </div>

      {/* Live Payout Ticker */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400" />
            <span>Live Winning Feed</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            REAL-TIME
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2 text-xs transition-all">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
              ₹
            </div>
            <span className="text-slate-300 font-medium">User {winners[winnerIndex].phone}</span>
          </div>
          <div className="text-right">
            <span className="font-black text-emerald-400">{winners[winnerIndex].amount}</span>
            <span className="text-[10px] text-slate-400 block">{winners[winnerIndex].game}</span>
          </div>
        </div>
      </div>

      {/* Trust & Security Badge */}
      <div className="border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
          <ShieldCheck size={24} />
        </div>
        <div className="text-xs">
          <div className="font-bold text-white">100% Verified Payments</div>
          <div className="text-slate-400 text-[11px]">
            Direct UPI intent through PhonePe, Google Pay, Paytm & Navi with instant UTR proof verification.
          </div>
        </div>
      </div>
    </div>
  );
};
