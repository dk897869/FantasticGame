import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw,
  History,
  QrCode,
  ArrowRight,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

export const Deposit = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState(500);
  const [selectedApp, setSelectedApp] = useState('phonepe');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showUpi, setShowUpi] = useState(false);
  
  // Checkout session
  const [config, setConfig] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300s)
  const [isExpired, setIsExpired] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  // Generate dynamic QR and order session
  const generateDynamicOrder = async () => {
    setIsGenerating(true);
    setMsg(null);
    setIsExpired(false);
    setTimeLeft(300);

    try {
      const data = await api.get(`/wallet/config?amount=${amount}&method=${selectedApp}`);
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to generate dynamic payment config:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api.get('/wallet/transactions?type=deposit');
      if (data.success) {
        setHistory(data.transactions);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  useEffect(() => {
    generateDynamicOrder();
    fetchHistory();
  }, [amount]);

  // 5-minute countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, config?.orderId]);

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 8) {
      setMsg({ type: 'error', text: 'Please enter valid 12-digit UTR / UPI Reference Number' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    try {
      const res = await api.post('/wallet/deposit', {
        amount,
        paymentMethod: selectedApp.toUpperCase(),
        utr: utrNumber.trim(),
        upiId: config?.upiId,
        orderId: config?.orderId
      });

      if (res.success) {
        setMsg({ 
          type: 'success', 
          text: 'Deposit submitted! Admin will verify your UTR and credit your balance within 5-10 minutes.' 
        });
        setUtrNumber('');
        fetchHistory();
        refreshUser();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const paymentApps = [
    { id: 'phonepe', name: 'PhonePe', icon: '🟣', link: config?.appLinks?.phonepe },
    { id: 'gpay', name: 'Google Pay', icon: '🔵', link: config?.appLinks?.gpay },
    { id: 'paytm', name: 'Paytm', icon: '🔷', link: config?.appLinks?.paytm },
    { id: 'navi', name: 'Navi UPI', icon: '🔶', link: config?.appLinks?.navi },
    { id: 'bhim', name: 'BHIM / BharatPe', icon: '🟢', link: config?.appLinks?.bhim },
  ];

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Balance Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
        <div>
          <span className="text-xs text-slate-400 font-medium">Available Balance</span>
          <div className="text-2xl font-black text-amber-400">
            ₹{Number(user?.balance || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="text-slate-400">Account:</span>
          <div className="font-bold text-slate-200">{user?.phone || user?.email || 'Player'}</div>
        </div>
      </div>

      {/* Step 1: Select Deposit Amount */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Select Deposit Amount</span>
          </span>
          <span className="text-amber-400 font-semibold text-[11px]">Min: ₹100</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[100, 300, 500, 1000, 2000, 5000].map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className={`py-3 rounded-2xl text-xs font-black transition-all ${
                amount === amt
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Custom Amount"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Step 2: Dynamic QR & 5-Minute Timer Display */}
      <div className="relative overflow-hidden bg-slate-900/95 border border-amber-500/40 rounded-3xl p-4 space-y-4 shadow-2xl">
        {/* Dynamic Timer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px]">
              2
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Dynamic Payment QR
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Order: {config?.orderId || 'FG...'}
              </div>
            </div>
          </div>

          {/* 5-Minute Countdown Timer Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono border ${
            isExpired 
              ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
              : timeLeft < 60 
              ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse' 
              : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
          }`}>
            <Clock size={14} />
            <span>{isExpired ? 'EXPIRED' : formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative flex flex-col items-center justify-center">
          {isExpired ? (
            <div className="w-64 h-64 rounded-3xl bg-slate-950 border border-rose-500/40 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertTriangle size={36} className="text-rose-500" />
              <div className="text-xs font-bold text-slate-300">
                Payment session has expired (5 min limit).
              </div>
              <button
                onClick={generateDynamicOrder}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 active:scale-95 shadow-md shadow-amber-500/20"
              >
                <RotateCcw size={14} />
                <span>Generate New Dynamic QR</span>
              </button>
            </div>
          ) : (
            <div className="relative p-3 bg-white rounded-3xl shadow-xl max-w-[220px]">
              {config?.qrCodeUrl ? (
                <div className="relative">
                  <img
                    src={config.qrCodeUrl}
                    alt="Dynamic Payment QR"
                    className="w-full h-auto rounded-2xl"
                  />
                  {/* Center Brand Badge on QR Code */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-amber-400 flex flex-col items-center justify-center shadow-lg shadow-black/60">
                      <span className="text-[11px] font-black text-amber-400 leading-none">FG</span>
                      <span className="text-[6px] font-extrabold text-white tracking-widest leading-none mt-0.5">GAME</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-800 text-xs">
                  Loading QR...
                </div>
              )}
              {/* Overlay brand badge on QR */}
              <div className="absolute inset-x-0 bottom-1 text-center">
                <span className="inline-flex items-center gap-1 bg-slate-900/95 text-[9px] text-amber-400 font-black px-2.5 py-0.5 rounded-full shadow border border-amber-400/30">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  <span>FANTASTIC GAME OFFICIAL</span>
                </span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Scan using PhonePe, Google Pay, Paytm, Navi or any UPI app
          </p>
        </div>

        {/* Merchant & UPI Details Box (Private info blurred & protected) */}
        <div className="space-y-2">
          {/* Verified Official Merchant & Blurred Gateway */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Merchant Payee:</span>
                <span className="font-black text-amber-400 flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                  <span>FANTASTIC GAME OFFICIAL</span>
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1">
                <Lock size={10} />
                <span>Encrypted Gateway</span>
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-900">
              <div className="overflow-hidden pr-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 block">Game UPI VPA:</span>
                  <button 
                    type="button" 
                    onClick={() => setShowUpi(!showUpi)}
                    className="text-[10px] text-amber-400/80 hover:text-amber-400 font-bold flex items-center gap-0.5 ml-1"
                  >
                    {showUpi ? <EyeOff size={11} /> : <Eye size={11} />}
                    <span>{showUpi ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="mt-0.5">
                  <span className={`font-mono text-xs font-bold transition-all ${
                    showUpi ? 'text-slate-200 select-all filter-none' : 'text-slate-500 blur-[4.5px] select-none'
                  }`}>
                    {config?.upiId || 'deepakut43287@naviaxis'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyText(config?.upiId || 'deepakut43287@naviaxis', 'upi')}
                className="px-3 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-black flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md shadow-amber-500/20"
              >
                {copiedUpi ? <Check size={14} strokeWidth={3} className="text-black" /> : <Copy size={14} />}
                <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
              </button>
            </div>
          </div>

          {/* Copy Exact Amount */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Payment Amount:</span>
              <span className="font-black text-white text-sm">
                ₹{amount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyText(amount.toString(), 'amount')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95"
            >
              {copiedAmount ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedAmount ? 'Copied' : 'Copy Amount'}</span>
            </button>
          </div>
        </div>

        {/* Direct Mobile App Intent Buttons */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-300 block">
            Or Tap to Open Installed Payment App:
          </span>

          <div className="grid grid-cols-2 gap-2">
            {paymentApps.map((app) => (
              <a
                key={app.id}
                href={app.link}
                onClick={() => setSelectedApp(app.id)}
                className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                  selectedApp === app.id
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{app.icon}</span>
                  <span className="text-xs font-bold">{app.name}</span>
                </div>
                <ExternalLink size={12} className="opacity-70" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: 12-Digit UTR Submission Form */}
      <form onSubmit={handleSubmitUtr} className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px]">
            3
          </div>
          <span className="font-black text-white text-xs uppercase tracking-wider">
            Submit 12-Digit UTR / Ref Number
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          After completing payment in your UPI app, copy the 12-digit UTR from the transaction receipt and enter it here:
        </p>

        <input
          type="text"
          maxLength={12}
          value={utrNumber}
          onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter 12-digit UTR (e.g. 423589123456)"
          className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono tracking-widest focus:outline-none focus:border-amber-400"
          required
        />

        {msg && (
          <div className={`p-3 rounded-2xl text-xs font-bold ${
            msg.type === 'error' 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Deposit for Verification'}
        </button>
      </form>

      {/* Deposit History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-white flex items-center gap-1.5">
            <History size={15} className="text-amber-400" />
            <span>Recent Deposits</span>
          </span>
          <span className="text-[10px] text-slate-400">Status & Verification</span>
        </div>

        <div className="space-y-2">
          {history.map((tx) => (
            <div key={tx._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <div>
                <div className="font-bold text-white">₹{tx.amount} • {tx.paymentMethod}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  UTR: {tx.utr || 'N/A'}
                </div>
                <div className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleTimeString()}</div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  tx.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : tx.status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                }`}>
                  {tx.status}
                </span>
                {tx.adminNote && (
                  <div className="text-[9px] text-slate-400 mt-1">{tx.adminNote}</div>
                )}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="py-4 text-center text-slate-500 text-xs">
              No deposit records yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
