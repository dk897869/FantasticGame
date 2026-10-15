import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { Gamepad2, Play, RotateCcw, Zap, Sparkles, TrendingUp } from 'lucide-react';

export const MiniGames = () => {
  const { user, refreshUser } = useAuth();
  const [activeGame, setActiveGame] = useState('dice'); // 'dice', 'wheel', 'crash'
  const [betAmount, setBetAmount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Dice states
  const [diceChoice, setDiceChoice] = useState('up'); // 'down', 'seven', 'up'
  const [diceValues, setDiceValues] = useState([3, 4]);

  // Wheel states
  const [wheelRotation, setWheelRotation] = useState(0);

  // Crash states
  const [crashTarget, setCrashTarget] = useState(1.8);

  const handlePlay = async () => {
    if (!user) {
      alert('Please log in to play!');
      return;
    }
    if (betAmount > (user?.balance || 0)) {
      alert('Insufficient wallet balance! Please recharge.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let prediction = diceChoice;
      if (activeGame === 'wheel') prediction = 'spin';
      if (activeGame === 'crash') prediction = crashTarget;

      const res = await api.post('/game/instant', {
        gameType: activeGame,
        amount: betAmount,
        prediction
      });

      if (res.success) {
        if (activeGame === 'dice') {
          setDiceValues([res.outcome.dice1, res.outcome.dice2]);
        } else if (activeGame === 'wheel') {
          // Calculate spin angle based on segment index
          const extraRotations = 5 * 360;
          const segmentAngle = 360 / 10;
          const targetAngle = extraRotations + (res.outcome.index * segmentAngle);
          setWheelRotation(prev => prev + targetAngle);
        }

        setTimeout(() => {
          setResult(res);
          refreshUser();
          if (res.won) {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          }
        }, activeGame === 'wheel' ? 2000 : 500);
      }
    } catch (err) {
      alert(err.message || 'Game failed');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, activeGame === 'wheel' ? 2200 : 600);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Game Selector Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-center">
        {[
          { id: 'dice', label: '7 Up 7 Down', icon: '🎲' },
          { id: 'wheel', label: 'Lucky Wheel', icon: '🎡' },
          { id: 'crash', label: 'Aviator Crash', icon: '🚀' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveGame(tab.id);
              setResult(null);
            }}
            className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${
              activeGame === tab.id
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Game Screen */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 shadow-2xl">
        {/* DICE GAME */}
        {activeGame === 'dice' && (
          <div className="space-y-5 text-center">
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                {diceValues[0]}
              </div>
              <div className="text-xl font-black text-slate-500">+</div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                {diceValues[1]}
              </div>
            </div>

            <div className="text-sm font-bold text-slate-300">
              Total Sum: <span className="text-amber-400 font-black text-xl">{diceValues[0] + diceValues[1]}</span>
            </div>

            {/* Prediction Choices */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDiceChoice('down')}
                className={`py-3 rounded-2xl font-black text-xs transition-all ${
                  diceChoice === 'down'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <div>2 - 6 DOWN</div>
                <div className="text-[10px] opacity-80">2X Payout</div>
              </button>

              <button
                onClick={() => setDiceChoice('seven')}
                className={`py-3 rounded-2xl font-black text-xs transition-all ${
                  diceChoice === 'seven'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <div>LUCKY 7</div>
                <div className="text-[10px] opacity-80">5X Payout</div>
              </button>

              <button
                onClick={() => setDiceChoice('up')}
                className={`py-3 rounded-2xl font-black text-xs transition-all ${
                  diceChoice === 'up'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <div>8 - 12 UP</div>
                <div className="text-[10px] opacity-80">2X Payout</div>
              </button>
            </div>
          </div>
        )}

        {/* WHEEL GAME */}
        {activeGame === 'wheel' && (
          <div className="space-y-4 text-center">
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Pointer */}
              <div className="absolute top-0 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />

              {/* Rotating Wheel graphic */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: 'transform 2s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
                className="w-full h-full rounded-full border-4 border-amber-400 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900"
              >
                <div className="grid grid-cols-2 w-full h-full text-[10px] font-black text-white p-2">
                  <div className="flex items-center justify-center bg-rose-500/80 m-0.5 rounded">10X</div>
                  <div className="flex items-center justify-center bg-emerald-500/80 m-0.5 rounded">2X</div>
                  <div className="flex items-center justify-center bg-blue-500/80 m-0.5 rounded">1.5X</div>
                  <div className="flex items-center justify-center bg-amber-500/80 m-0.5 rounded text-black">5X</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">Spin the wheel to hit up to 10X multiplier!</p>
          </div>
        )}

        {/* AVIATOR CRASH GAME */}
        {activeGame === 'crash' && (
          <div className="space-y-4 text-center">
            <div className="h-40 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-4xl animate-bounce mb-2">🚀</div>
              <div className="text-3xl font-black font-mono text-emerald-400 tracking-wider">
                {result ? `${result.outcome.crashPoint}x` : `${crashTarget}x`}
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                Cashout Target
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-slate-400">Target Multiplier:</span>
              <div className="flex gap-1.5">
                {[1.2, 1.5, 2.0, 3.0, 5.0].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCrashTarget(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      crashTarget === m
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bet Amount Selector */}
        <div className="mt-5 space-y-2 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Select Bet Amount</span>
            <span>Balance: ₹{user?.balance || 0}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  betAmount === amt
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* Result Alert */}
          {result && (
            <div className={`p-3 rounded-2xl text-xs font-extrabold text-center ${
              result.won ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {result.won ? `🎉 You Won ₹${result.winAmount}!` : '💔 Better luck next round!'}
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={handlePlay}
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Rolling / Spinning...' : `Play Now (₹${betAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
