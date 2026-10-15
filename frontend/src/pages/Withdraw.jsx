import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  TrendingUp, 
  Landmark, 
  ShieldCheck, 
  History, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Withdraw = () => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawType, setWithdrawType] = useState('upi');
  const [holderName, setHolderName] = useState(user?.bankDetails?.holderName || '');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(user?.bankDetails?.ifsc || '');
  const [upiId, setUpiId] = useState(user?.bankDetails?.upiId || '');
  
  // Real-time UPI verification
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [verifiedUpiName, setVerifiedUpiName] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [history, setHistory] = useState([]);

  const isEligible = (user?.totalDeposited || 0) >= 100;

  const fetchHistory = async () => {
    try {
      const data = await api.get('/wallet/transactions?type=withdrawal');
      if (data.success) {
        setHistory(data.transactions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
    refreshUser();
  }, []);

  // UPI verification handler
  const handleVerifyUpi = async () => {
    if (!upiId || !upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. mobile@paytm or user@okaxis)');
      return;
    }
    setVerifyingUpi(true);
    setVerifiedUpiName(null);
    try {
      const res = await api.post('/wallet/verify-upi', { upiId });
      if (res.success && res.verified) {
        setVerifiedUpiName(res.accountHolderName);
        if (!holderName) {
          setHolderName(res.accountHolderName.split('(')[0].trim());
        }
      }
    } catch (err) {
      alert(err.message || 'UPI verification failed');
    } finally {
      setVerifyingUpi(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const withdrawAmt = Number(amount);

    if (!isEligible) {
      setMsg({
        type: 'error',
        text: 'First-time withdrawal requires adding at least ₹100 deposit to activate your payout gateway. Please make a deposit of ₹100 first to unlock withdrawals!'
      });
      return;
    }

    if (!withdrawAmt || withdrawAmt < 200) {
      setMsg({ type: 'error', text: 'Minimum withdrawal amount is ₹200' });
      return;
    }

    if (withdrawAmt > (user?.balance || 0)) {
      setMsg({ type: 'error', text: 'Insufficient wallet balance' });
      return;
    }

    if (withdrawType === 'upi' && !upiId) {
      setMsg({ type: 'error', text: 'Please enter valid UPI ID' });
      return;
    }

    if (withdrawType === 'bank' && (!accountNumber || !ifsc || !holderName)) {
      setMsg({ type: 'error', text: 'Please complete all bank fields (Name, A/C, IFSC)' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const accountDetails = {
        holderName: verifiedUpiName || holderName,
        accountNumber,
        ifsc,
        upiId
      };

      await api.post('/auth/bank-details', accountDetails);

      const res = await api.post('/wallet/withdraw', {
        amount: withdrawAmt,
        paymentMethod: withdrawType.toUpperCase(),
        accountDetails
      });

      if (res.success) {
        setMsg({ 
          type: 'success', 
          text: 'Withdrawal request submitted! Admin will verify and transfer funds to your account within 4 hours.' 
        });
        setAmount('');
        refreshUser();
        fetchHistory();
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Withdrawal failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
        <div>
          <span className="text-xs text-slate-400 font-medium">Withdrawable Balance</span>
          <div className="text-2xl font-black text-amber-400">
            ₹{Number(user?.balance || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400">
          <TrendingUp size={24} />
        </div>
      </div>

      {/* 4-Hour Processing Notice Banner */}
      <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3 text-xs text-blue-200">
        <Clock size={18} className="text-blue-400 shrink-0" />
        <div>
          <span className="font-bold block text-white">Fast 4-Hour Payouts</span>
          <span>Approved withdrawal requests are credited to your Bank Account or UPI within 4 hours.</span>
        </div>
      </div>

      {/* First-time 100rs Deposit Requirement Alert */}
      {!isEligible && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-3xl p-4 space-y-2.5 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
            <AlertCircle size={18} />
            <span>Account Activation Required</span>
          </div>
          <p className="leading-relaxed">
            First-time withdrawal requires adding at least <b>₹100 deposit</b> to activate your payout gateway. Your current deposit is <b>₹{user?.totalDeposited || 0}</b>.
          </p>
          <Link
            to="/deposit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs active:scale-95 shadow-md shadow-amber-500/20"
          >
            <span>Deposit ₹100 to Unlock Withdrawals</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Withdrawal Form */}
      <form onSubmit={handleWithdraw} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3.5 shadow-xl">
        <span className="text-xs font-black text-white block uppercase tracking-wider">
          Withdrawal Method
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWithdrawType('upi')}
            className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
              withdrawType === 'upi'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            UPI Transfer (Instant Verify)
          </button>
          <button
            type="button"
            onClick={() => setWithdrawType('bank')}
            className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
              withdrawType === 'bank'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            Bank Account
          </button>
        </div>

        {/* Withdrawal Amount */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Withdrawal Amount (₹)</span>
            <span className="text-amber-400">Min: ₹200</span>
          </div>
          <input
            type="number"
            min={200}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (Min ₹200)"
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
            required
          />
        </div>

        {/* UPI Details with Live Verification */}
        {withdrawType === 'upi' ? (
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-medium">Your UPI ID (VPA)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setVerifiedUpiName(null);
                }}
                placeholder="e.g. 9876543210@paytm or user@okaxis"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                required
              />
              <button
                type="button"
                onClick={handleVerifyUpi}
                disabled={verifyingUpi}
                className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/30 text-xs font-bold active:scale-95 transition-all"
              >
                {verifyingUpi ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            {/* Verification Result Badge */}
            {verifiedUpiName && (
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Bank Resolved Account Name:</span>
                  <span className="font-black text-white">{verifiedUpiName}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Account Holder Name</label>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Name as per bank passbook"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">Bank Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">IFSC Code</label>
              <input
                type="text"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>
        )}

        {msg && (
          <div className={`p-3 rounded-2xl text-xs font-bold ${
            msg.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isEligible}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40"
        >
          {loading ? 'Submitting...' : 'Submit Withdrawal (Payout in 4h)'}
        </button>
      </form>

      {/* History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3">
        <span className="text-xs font-black text-white flex items-center gap-1.5">
          <History size={15} className="text-amber-400" />
          <span>Withdrawal History</span>
        </span>

        <div className="space-y-2">
          {history.map((tx) => (
            <div key={tx._id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <div>
                <div className="font-bold text-white">₹{tx.amount} • {tx.paymentMethod}</div>
                <div className="text-[10px] text-slate-400">
                  {tx.accountDetails?.upiId || tx.accountDetails?.accountNumber || 'Account'}
                </div>
                <div className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleTimeString()}</div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
              No withdrawal records yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
