import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Clock, 
  History, 
  Lock, 
  Sparkles,
  Trophy,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const WinGoGame = () => {
  const { user, refreshUser } = useAuth();
  const { gameState30s, gameState1m, lastRoundResult } = useSocket();

  const [activeTab, setActiveTab] = useState('30s'); // '30s' default
  const [historyTab, setHistoryTab] = useState('game'); // 'game' or 'my'
  const [gameHistory, setGameHistory] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const myBetsRef = useRef([]);

  useEffect(() => {
    myBetsRef.current = myBets;
  }, [myBets]);
  
  // Current active game state based on tab
  const currentGameState = activeTab === '30s' ? gameState30s : gameState1m;
  const currentGameType = activeTab === '30s' ? 'wingo_30s' : 'wingo_1m';

  // Bet Modal state
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [baseAmount, setBaseAmount] = useState(1); // Starts from ₹1!
  const [multiplier, setMultiplier] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Win / Lose Screen Modal Popup state
  const [outcomeModal, setOutcomeModal] = useState(null); // { won: boolean, winAmount: number, number: number, color: string, period: string }

  // Fetch Game History
  const fetchGameHistory = async () => {
    try {
      const data = await api.get(`/game/history?gameType=${currentGameType}&limit=15`);
      if (data.success) {
        setGameHistory(data.rounds);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  // Fetch My Bets
  const fetchMyBets = async () => {
    if (!user) return;
    try {
      const data = await api.get(`/game/my-bets?gameType=${currentGameType}&limit=15`);
      if (data.success) {
        setMyBets(data.bets);
      }
    } catch (err) {
      console.error('My bets fetch error:', err);
    }
  };

  useEffect(() => {
    fetchGameHistory();
    fetchMyBets();
  }, [user, activeTab]);

  // When a round settles
  useEffect(() => {
    if (lastRoundResult && lastRoundResult.outcome) {
      if (lastRoundResult.gameType && lastRoundResult.gameType !== currentGameType) return;

      fetchGameHistory();
      refreshUser();

      const winningNumber = Number(lastRoundResult.outcome?.number);
      const winningColor = (lastRoundResult.outcome?.color || '').toLowerCase();
      const winningSize = (lastRoundResult.outcome?.size || '').toLowerCase();

      const evaluateSettlement = (betsList) => {
        const betsForPeriod = (betsList || []).filter(b => b.period === lastRoundResult.period);
        if (betsForPeriod.length === 0) return;

        let anyWin = false;
        let totalWin = 0;
        let totalBet = 0;

        for (const b of betsForPeriod) {
          totalBet += b.amount;
          const sel = b.selection.toString().toLowerCase();
          let bWon = false;
          let multiplier = 0;

          // If backend already marked it as won
          if (b.status === 'won') {
            bWon = true;
            totalWin += (b.winAmount || Math.floor(b.amount * (b.payoutMultiplier || 2) * 0.98));
            anyWin = true;
            continue;
          }

          // Number match (0-9) -> 9x
          if (sel === winningNumber.toString()) {
            bWon = true;
            multiplier = 9;
          }
          // Color match
          else if (sel === 'green' && (winningColor === 'green' || winningColor === 'green-violet' || [1, 3, 7, 9].includes(winningNumber))) {
            bWon = true;
            multiplier = (winningColor === 'green-violet' || winningNumber === 5) ? 1.5 : 2;
          } else if (sel === 'red' && (winningColor === 'red' || winningColor === 'red-violet' || [2, 4, 6, 8].includes(winningNumber))) {
            bWon = true;
            multiplier = (winningColor === 'red-violet' || winningNumber === 0) ? 1.5 : 2;
          } else if (sel === 'violet' && (winningNumber === 0 || winningNumber === 5 || winningColor.includes('violet'))) {
            bWon = true;
            multiplier = 4.5;
          }
          // Size match
          else if (sel === 'big' && (winningSize === 'big' || winningNumber >= 5)) {
            bWon = true;
            multiplier = 2;
          } else if (sel === 'small' && (winningSize === 'small' || winningNumber <= 4)) {
            bWon = true;
            multiplier = 2;
          }

          if (bWon) {
            anyWin = true;
            totalWin += Math.floor(b.amount * multiplier * 0.98);
          }
        }

        setOutcomeModal({
          won: anyWin,
          winAmount: totalWin,
          betAmount: totalBet,
          number: winningNumber,
          color: winningColor,
          size: winningSize,
          period: lastRoundResult.period
        });

        if (anyWin) {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 }
          });
        }
      };

      // 1. Evaluate immediately using myBetsRef
      evaluateSettlement(myBetsRef.current);

      // 2. Fetch fresh bets from server and re-evaluate to ensure 100% sync
      setTimeout(async () => {
        try {
          const data = await api.get(`/game/my-bets?gameType=${currentGameType}&limit=15`);
          if (data.success && data.bets) {
            setMyBets(data.bets);
            evaluateSettlement(data.bets);
          }
        } catch (e) {
          console.error('Fetch bets after round error:', e);
        }
      }, 500);
    }
  }, [lastRoundResult]);

  const openBetModal = (type, value, mult) => {
    if (!user) {
      alert('Please log in to place bets!');
      return;
    }
    if (currentGameState.isFrozen) {
      alert('Betting locked! Drawing winning result. Next round begins in a few seconds.');
      return;
    }
    setSelectedBet({ type, value, multiplier: mult });
    setBaseAmount(1); // Start from ₹1
    setMultiplier(1);
    setMessage(null);
    setBetModalOpen(true);
  };

  const totalBetAmount = Math.max(1, (Number(baseAmount) || 1) * multiplier);

  const handleConfirmBet = async () => {
    if (totalBetAmount > (user?.balance || 0)) {
      setMessage({ type: 'error', text: 'Insufficient wallet balance!' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/game/bet', {
        gameType: currentGameType,
        period: currentGameState.period,
        selection: selectedBet.value,
        amount: totalBetAmount
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Bet of ₹${totalBetAmount} placed successfully!` });
        if (res.bet) {
          setMyBets(prev => [res.bet, ...prev]);
        }
        refreshUser();
        setTimeout(() => {
          setBetModalOpen(false);
        }, 1200);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to place bet' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const getColorClass = (color) => {
    if (color === 'green') return 'bg-emerald-500 text-white';
    if (color === 'red') return 'bg-rose-500 text-white';
    if (color === 'violet') return 'bg-purple-500 text-white';
    if (color === 'green-violet') return 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white';
    if (color === 'red-violet') return 'bg-gradient-to-r from-rose-500 to-purple-500 text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Game Mode Tabs (30s highlighted) */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-center">
        {[
          { id: '30s', label: 'Win Go 30s ⚡' },
          { id: '1m', label: 'Win Go 1M' },
          { id: '3m', label: 'Win Go 3M' },
          { id: '5m', label: 'Win Go 5M' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20 scale-[1.02]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Period & Countdown Timer Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/40 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <History size={14} />
              <span>Period ({activeTab})</span>
            </div>
            <div className="text-xl font-black text-amber-400 tracking-wider mt-0.5 font-mono">
              {currentGameState?.period || '---'}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-slate-400 text-xs">
              <Clock size={14} />
              <span>Time Left</span>
            </div>
            <div className={`text-3xl font-black font-mono tracking-widest mt-0.5 ${
              currentGameState?.isFrozen ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
            }`}>
              {formatTime(currentGameState?.timeLeft || 0)}
            </div>
          </div>
        </div>

        {/* Lock Notice */}
        {currentGameState?.isFrozen && (
          <div className="mt-3 py-1.5 px-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
            <Lock size={14} />
            <span>Betting Locked! Drawing winning number...</span>
          </div>
        )}
      </div>

      {/* 3 Main Color Buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => openBetModal('color', 'green', 2)}
          disabled={currentGameState?.isFrozen}
          className="py-4 px-2 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="text-sm uppercase tracking-wider">Green</div>
          <div className="text-[10px] font-bold text-emerald-200 mt-0.5">2X Multiplier</div>
        </button>

        <button
          onClick={() => openBetModal('color', 'violet', 4.5)}
          disabled={currentGameState?.isFrozen}
          className="py-4 px-2 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 text-white font-extrabold shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="text-sm uppercase tracking-wider">Violet</div>
          <div className="text-[10px] font-bold text-purple-200 mt-0.5">4.5X Multiplier</div>
        </button>

        <button
          onClick={() => openBetModal('color', 'red', 2)}
          disabled={currentGameState?.isFrozen}
          className="py-4 px-2 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 text-white font-extrabold shadow-lg shadow-rose-600/30 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="text-sm uppercase tracking-wider">Red</div>
          <div className="text-[10px] font-bold text-rose-200 mt-0.5">2X Multiplier</div>
        </button>
      </div>

      {/* Numbers 0 - 9 Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3.5 shadow-xl">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-extrabold text-slate-200">Select Number (9X Payout)</span>
          <span className="text-amber-400 text-[11px] font-black">Min Bet: ₹1</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[
            { num: 0, color: 'bg-gradient-to-br from-rose-500 to-purple-600' },
            { num: 1, color: 'bg-emerald-500' },
            { num: 2, color: 'bg-rose-500' },
            { num: 3, color: 'bg-emerald-500' },
            { num: 4, color: 'bg-rose-500' },
            { num: 5, color: 'bg-gradient-to-br from-emerald-500 to-purple-600' },
            { num: 6, color: 'bg-rose-500' },
            { num: 7, color: 'bg-emerald-500' },
            { num: 8, color: 'bg-rose-500' },
            { num: 9, color: 'bg-emerald-500' },
          ].map((item) => (
            <button
              key={item.num}
              onClick={() => openBetModal('number', item.num.toString(), 9)}
              disabled={currentGameState?.isFrozen}
              className={`${item.color} h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-50`}
            >
              {item.num}
            </button>
          ))}
        </div>
      </div>

      {/* Big / Small Choice */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => openBetModal('size', 'big', 2)}
          disabled={currentGameState?.isFrozen}
          className="py-3.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <span>BIG (5-9)</span>
          <span className="text-[10px] font-bold block opacity-80">2X Payout</span>
        </button>

        <button
          onClick={() => openBetModal('size', 'small', 2)}
          disabled={currentGameState?.isFrozen}
          className="py-3.5 px-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <span>SMALL (0-4)</span>
          <span className="text-[10px] font-bold block opacity-80">2X Payout</span>
        </button>
      </div>

      {/* Game Records & My Bets */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex border-b border-slate-800 pb-2 mb-3">
          <button
            onClick={() => setHistoryTab('game')}
            className={`flex-1 py-1 text-xs font-bold transition-colors ${
              historyTab === 'game' ? 'text-amber-400 border-b-2 border-amber-400 -mb-2.5' : 'text-slate-400'
            }`}
          >
            Game Records ({activeTab})
          </button>
          <button
            onClick={() => setHistoryTab('my')}
            className={`flex-1 py-1 text-xs font-bold transition-colors ${
              historyTab === 'my' ? 'text-amber-400 border-b-2 border-amber-400 -mb-2.5' : 'text-slate-400'
            }`}
          >
            My Bets History
          </button>
        </div>

        {historyTab === 'game' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2">Period</th>
                  <th className="py-2 text-center">Number</th>
                  <th className="py-2 text-center">Size</th>
                  <th className="py-2 text-right">Color</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {gameHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30">
                    <td className="py-2 text-slate-300 font-mono">{item.period.slice(-5)}</td>
                    <td className="py-2 text-center font-bold text-white">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${getColorClass(item.outcome?.color)}`}>
                        {item.outcome?.number ?? '-'}
                      </span>
                    </td>
                    <td className="py-2 text-center text-xs uppercase text-slate-300">
                      {item.outcome?.size || '-'}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`inline-block w-3 h-3 rounded-full ${getColorClass(item.outcome?.color)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            {myBets.map((bet) => (
              <div key={bet._id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Period: {bet.period.slice(-5)}</div>
                  <div className="font-bold text-white capitalize mt-0.5">
                    Select: <span className="text-amber-400">{bet.selection}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-200">₹{bet.amount}</div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    bet.status === 'won' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : bet.status === 'lost' 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {bet.status === 'won' ? `+₹${bet.winAmount}` : bet.status}
                  </span>
                </div>
              </div>
            ))}
            {myBets.length === 0 && (
              <div className="py-6 text-center text-slate-500 text-xs">
                No bets placed yet. Minimum bet starts at just ₹1!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bet Confirmation Modal with 1 RS START and CUSTOM ENTER */}
      {betModalOpen && selectedBet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <h3 className="font-black text-white text-base uppercase">
                  Select {selectedBet.value} ({selectedBet.multiplier}X)
                </h3>
              </div>
              <button 
                onClick={() => setBetModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Amount Selector starting at ₹1 */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-bold">Quick Contract Amount</span>
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 5, 10, 50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBaseAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      baseAmount === amt
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input Field */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block">
                Enter Custom Amount (Any amount you want):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-black">₹</span>
                <input
                  type="number"
                  min={1}
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Math.max(1, Number(e.target.value)))}
                  placeholder="Enter custom bet (e.g. 1, 2, 25, 100)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-8 pr-4 py-2 text-sm text-white font-black focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Multiplier Chips */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-bold">Multiplier (X)</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 20, 50].map((mult) => (
                  <button
                    key={mult}
                    onClick={() => setMultiplier(mult)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      multiplier === mult
                        ? 'bg-amber-400 text-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mult}X
                  </button>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Total Bet Amount:</span>
                <div className="text-lg font-black text-amber-400">₹{totalBetAmount}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Wallet Balance:</span>
                <div className="font-bold text-white">₹{user?.balance || 0}</div>
              </div>
            </div>

            {message && (
              <div className={`p-2.5 rounded-xl text-xs font-bold ${
                message.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setBetModalOpen(false)}
                className="py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBet}
                disabled={submitting || currentGameState?.isFrozen}
                className="py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Placing...' : `Confirm (₹${totalBetAmount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WIN / LOSE FULL SCREEN MODAL POPUP */}
      {outcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xs bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {outcomeModal.won ? (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 mx-auto flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
                  🏆
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-400 uppercase tracking-wider">
                    Congratulations!
                  </h3>
                  <p className="text-xs text-slate-300 font-bold mt-0.5">
                    You won this round!
                  </p>
                </div>
                <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-2xl">
                  <span className="text-xs text-slate-400">Winning Payout:</span>
                  <div className="text-2xl font-black text-emerald-400">+₹{outcomeModal.winAmount}</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center text-4xl shadow-xl shadow-rose-500/30">
                  💔
                </div>
                <div>
                  <h3 className="text-xl font-black text-rose-400 uppercase tracking-wider">
                    Better Luck Next Round!
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Don't worry, 30s rounds run all day!
                  </p>
                </div>
              </>
            )}

            {/* Outcome Details */}
            <div className="bg-slate-950/80 rounded-2xl p-2.5 text-xs text-slate-300 flex items-center justify-around font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Number</span>
                <span className="font-bold text-white text-base">{outcomeModal.number}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Color</span>
                <span className="font-bold text-amber-400 uppercase text-xs">{outcomeModal.color}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Size</span>
                <span className="font-bold text-blue-400 uppercase text-xs">{outcomeModal.size}</span>
              </div>
            </div>

            <button
              onClick={() => setOutcomeModal(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
