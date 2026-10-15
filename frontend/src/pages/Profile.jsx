import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  Wallet, 
  Share2, 
  Copy, 
  Check, 
  LogOut, 
  ShieldCheck, 
  CreditCard, 
  Gift, 
  Award,
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';

export const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [bankModal, setBankModal] = useState(false);

  // Bank form state
  const [holderName, setHolderName] = useState(user?.bankDetails?.holderName || '');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(user?.bankDetails?.ifsc || '');
  const [upiId, setUpiId] = useState(user?.bankDetails?.upiId || '');
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <User size={32} />
        </div>
        <h2 className="text-xl font-black text-white">You are not logged in</h2>
        <p className="text-xs text-slate-400">Log in to view wallet, invitation links, and game records.</p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/#/register?invitationCode=${user.invitationCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    setBankMsg(null);
    try {
      const res = await api.post('/auth/bank-details', {
        holderName,
        accountNumber,
        ifsc,
        upiId
      });
      if (res.success) {
        setBankMsg({ type: 'success', text: 'Bank/UPI details saved!' });
        refreshUser();
        setTimeout(() => setBankModal(false), 1200);
      }
    } catch (err) {
      setBankMsg({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 p-5 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl border-2 border-amber-400 overflow-hidden bg-slate-800 shrink-0">
            <img 
              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user._id}`} 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white truncate">{user.name}</h2>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase border border-amber-500/30">
                VIP 1
              </span>
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">{user.phone || user.email}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {user._id?.slice(-8)}</div>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] text-slate-400">Wallet Balance</span>
            <div className="text-base font-black text-amber-400 mt-0.5">₹{user.balance}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Total Deposited</span>
            <div className="text-sm font-bold text-white mt-0.5">₹{user.totalDeposited || 0}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Total Withdrawn</span>
            <div className="text-sm font-bold text-white mt-0.5">₹{user.totalWithdrawn || 0}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to="/deposit"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs text-center shadow-md active:scale-95"
          >
            Deposit
          </Link>
          <Link
            to="/withdraw"
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs text-center border border-slate-700 active:scale-95"
          >
            Withdraw
          </Link>
        </div>
      </div>

      {/* Referral & Invite Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-white flex items-center gap-1.5">
            <Share2 size={16} className="text-purple-400" />
            <span>Refer & Earn (₹50 / Friend)</span>
          </span>
          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Earned: ₹{user.referralEarnings || 0}
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs">
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-500 block">Your Invitation Code:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {user.invitationCode}
            </span>
          </div>
          <button
            onClick={copyReferral}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Account Settings Menu */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-2 divide-y divide-slate-800/60 text-xs">
        <button
          onClick={() => setBankModal(true)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 rounded-2xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="font-bold text-white">Bank & UPI Card Settings</div>
              <div className="text-[10px] text-slate-400">Save bank details for withdrawals</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500" />
        </button>


        <button
          onClick={logout}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-rose-500/10 rounded-2xl transition-colors text-rose-400"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <LogOut size={18} />
            </div>
            <div className="font-bold">Log Out</div>
          </div>
        </button>
      </div>

      {/* Bank Details Modal */}
      {bankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5">
            <h3 className="font-black text-white text-base">Withdrawal Account Details</h3>
            <p className="text-xs text-slate-400">Save your UPI ID and Bank Details for one-click payouts.</p>

            <form onSubmit={handleSaveBank} className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-400">UPI ID (e.g. mobile@paytm)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="UPI ID"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Account Holder Name</label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Bank Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">IFSC Code</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="IFSC Code"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              {bankMsg && (
                <div className={`p-2 rounded-xl text-xs font-bold ${
                  bankMsg.type === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {bankMsg.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBankModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBank}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs"
                >
                  {savingBank ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
