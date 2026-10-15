import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  X, 
  Settings, 
  Search,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Edit2,
  Lock,
  Send,
  Eye,
  Filter
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'accounts', 'withdrawals', 'transfer', 'settings'
  const [stats, setStats] = useState(null);
  
  // Orders state
  const [deposits, setDeposits] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState([]);

  // Accounts state
  const [userList, setUserList] = useState([]);
  const [searchUser, setSearchUser] = useState('');

  // Settings state
  const [settings, setSettings] = useState(null);

  // Transfer state
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMsg, setTransferMsg] = useState(null);

  // Edit Balance Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editAction, setEditAction] = useState('add');

  // Admin credentials login
  const [adminEmail, setAdminEmail] = useState('dk897869@gmail.com');
  const [adminPassword, setAdminPassword] = useState('C97ffywc@');
  const [loginErr, setLoginErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = user && user.role === 'admin';

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await api.get(`/admin/deposits?status=${orderFilter}`);
      if (res.success) setDeposits(res.deposits);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/admin/withdrawals?status=all');
      if (res.success) setWithdrawals(res.withdrawals);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(searchUser)}`);
      if (res.success) {
        setUserList(res.users);
        if (res.users.length > 1 && !fromUserId) {
          setFromUserId(res.users[0]._id);
          setToUserId(res.users[1]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.success) setSettings(res.setting);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    fetchStats();
    fetchDeposits();
    fetchWithdrawals();
    fetchUsers();
    fetchSettings();
  };

  useEffect(() => {
    if (isAdmin) {
      refreshAll();
    }
  }, [isAdmin, orderFilter]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginErr(null);
    try {
      const res = await api.post('/auth/admin-login', { 
        email: adminEmail, 
        password: adminPassword 
      });
      if (res.success) {
        login(res.token, res.user);
      }
    } catch (err) {
      setLoginErr(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDeposit = async (id, action) => {
    if (!confirm(`Confirm ${action.toUpperCase()} deposit?`)) return;
    try {
      const res = await api.post(`/admin/deposits/${id}/verify`, { action });
      if (res.success) {
        alert(res.message);
        fetchDeposits();
        fetchStats();
        fetchUsers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyWithdrawal = async (id, action) => {
    if (!confirm(`Confirm ${action.toUpperCase()} withdrawal?`)) return;
    try {
      const res = await api.post(`/admin/withdrawals/${id}/verify`, { action });
      if (res.success) {
        alert(res.message);
        fetchWithdrawals();
        fetchStats();
        fetchUsers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Execute Account-to-Account Transfer
  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!fromUserId || !toUserId || !transferAmount) {
      setTransferMsg({ type: 'error', text: 'Please fill all transfer fields' });
      return;
    }

    setTransferLoading(true);
    setTransferMsg(null);

    try {
      const res = await api.post('/admin/transfer', {
        fromUserId,
        toUserId,
        amount: transferAmount,
        note: transferNote
      });

      if (res.success) {
        setTransferMsg({ type: 'success', text: res.message });
        setTransferAmount('');
        setTransferNote('');
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      setTransferMsg({ type: 'error', text: err.message || 'Transfer failed' });
    } finally {
      setTransferLoading(false);
    }
  };

  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/admin/users/${selectedUser._id}/balance`, {
        amount: editAmount,
        action: editAction
      });
      if (res.success) {
        alert('Balance updated!');
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleBlock = async (id) => {
    try {
      const res = await api.post(`/admin/users/${id}/toggle-block`);
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/settings', settings);
      if (res.success) {
        alert('Settings updated successfully!');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const { logout } = useAuth();

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto pt-16 px-4 space-y-4">
        <div className="bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Lock size={32} />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-white">Master Admin Portal</h2>
            <p className="text-xs text-amber-400 font-semibold">
              Authorized Access Only: dk897869@gmail.com
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3.5 pt-2">
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="dk897869@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {loginErr && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl text-center">
                {loginErr}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign In as Master Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const fromUserObj = userList.find(u => u._id === fromUserId);
  const toUserObj = userList.find(u => u._id === toUserId);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Admin Title & Quick Actions */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-base font-black text-white">FantasticGame Master Dashboard</h1>
            <span className="text-[11px] text-slate-400">Logged in: {user?.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/20 active:scale-95 transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold active:scale-95 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* 4 Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-3.5 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Registered Players</span>
          <div className="text-xl font-black text-white mt-1">{stats?.totalUsers ?? userList.length}</div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-amber-500/40 rounded-3xl p-3.5 shadow-lg">
          <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">Pending UTR Orders</span>
          <div className="text-xl font-black text-amber-400 mt-1">{stats?.pendingDeposits ?? 0}</div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-3.5 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Approved Deposits</span>
          <div className="text-xl font-black text-emerald-400 mt-1">₹{stats?.totalDepositAmount ?? 0}</div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-3.5 shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Approved Payouts</span>
          <div className="text-xl font-black text-rose-400 mt-1">₹{stats?.totalWithdrawalAmount ?? 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-5 gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-center text-xs font-black">
        {[
          { id: 'orders', label: 'All Orders' },
          { id: 'accounts', label: 'All Accounts' },
          { id: 'transfer', label: 'Fund Transfer' },
          { id: 'withdrawals', label: 'Payouts (4h)' },
          { id: 'settings', label: 'UPI Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-1 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL ORDERS (SBHI ORDERS) */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
            <span className="text-xs font-black text-white">All Deposit Orders ({deposits.length})</span>
            
            {/* Filter buttons */}
            <div className="flex gap-1 text-[11px] font-bold">
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-3 py-1 rounded-xl capitalize transition-all ${
                    orderFilter === f
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {deposits.map((item) => (
              <div key={item._id} className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-emerald-400">₹{item.amount}</span>
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                      {item.paymentMethod}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* UTR & Order Details */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">12-Digit UTR Number:</span>
                    <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
                      {item.utr || 'No UTR submitted'}
                    </span>
                  </div>
                  {item.adminNote && (
                    <div className="text-slate-400 text-[11px]">
                      Note: <span className="text-slate-200">{item.adminNote}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <div>
                    Player: <span className="text-white font-bold">{item.user?.name}</span> ({item.user?.phone || item.user?.email})
                  </div>
                  <div>
                    Balance: <span className="text-amber-400 font-bold">₹{item.user?.balance || 0}</span>
                  </div>
                </div>

                {/* Action buttons if pending */}
                {item.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleVerifyDeposit(item._id, 'reject')}
                      className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs hover:bg-rose-500/20"
                    >
                      Reject Order
                    </button>
                    <button
                      onClick={() => handleVerifyDeposit(item._id, 'approve')}
                      className="py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      Approve & Credit Balance
                    </button>
                  </div>
                )}
              </div>
            ))}

            {deposits.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-xs">
                No orders found under this filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL ACCOUNTS (SBHI ACCOUNTS MEI KITNA PAISA HAI) */}
      {activeTab === 'accounts' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search by name, phone, email, or invitation code..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            {userList.map((u) => (
              <div key={u._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      <img 
                        src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u._id}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <div className="font-black text-white text-sm flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isBlocked && (
                          <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-black">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.phone || u.email || 'No Contact'} • Code: {u.invitationCode}
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Balance */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Wallet Balance</span>
                    <span className="text-lg font-black text-amber-400">₹{u.balance}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Deposited</span>
                    <span className="font-bold text-emerald-400">₹{u.totalDeposited || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Withdrawn</span>
                    <span className="font-bold text-rose-400">₹{u.totalWithdrawn || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Joined</span>
                    <span className="text-[11px] text-slate-300">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions for this user */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setFromUserId(u._id);
                      setActiveTab('transfer');
                    }}
                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 flex items-center gap-1"
                  >
                    <ArrowLeftRight size={13} />
                    <span>Transfer Funds</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setEditAmount(u.balance);
                      setEditAction('set');
                    }}
                    className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-500/20 flex items-center gap-1"
                  >
                    <Edit2 size={13} />
                    <span>Adjust Balance</span>
                  </button>

                  <button
                    onClick={() => handleToggleBlock(u._id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                      u.isBlocked 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN ACCOUNT-TO-ACCOUNT FUND TRANSFER */}
      {activeTab === 'transfer' && (
        <form onSubmit={handleExecuteTransfer} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Transfer Money Between Accounts</h2>
              <span className="text-[11px] text-slate-400">Admin can move funds directly from any user account to another</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Sender Account */}
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                Source Account (Paisa kiske account se katega):
              </label>
              <select
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              >
                <option value="">Select Sender Account</option>
                {userList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.phone || u.email || u.invitationCode}) - Balance: ₹{u.balance}
                  </option>
                ))}
              </select>
              {fromUserObj && (
                <div className="text-[10px] text-amber-400 mt-1 font-bold">
                  Available to Transfer: ₹{fromUserObj.balance}
                </div>
              )}
            </div>

            {/* Receiver Account */}
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                Destination Account (Paisa kiske account mei jayega):
              </label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              >
                <option value="">Select Receiver Account</option>
                {userList.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.phone || u.email || u.invitationCode}) - Current Balance: ₹{u.balance}
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                Amount to Transfer (₹)
              </label>
              <input
                type="number"
                min={1}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2.5 text-sm text-white font-black focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">
                Transfer Note / Reason (Optional)
              </label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="e.g. Account adjustment or prize settlement"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {transferMsg && (
              <div className={`p-3 rounded-2xl text-xs font-bold ${
                transferMsg.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {transferMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={transferLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {transferLoading ? 'Transferring...' : 'Execute Balance Transfer Now'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: PAYOUTS / WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Player Withdrawal Requests ({withdrawals.length})</span>
            <span className="text-blue-400">4-Hour SLA Processing</span>
          </div>

          <div className="space-y-2">
            {withdrawals.map((item) => (
              <div key={item._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-rose-400">₹{item.amount}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                      {item.paymentMethod}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400 animate-pulse'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-1">
                  <div>
                    <span className="text-slate-400">Holder Name: </span>
                    <span className="font-bold text-white">{item.accountDetails?.holderName || item.user?.name}</span>
                  </div>
                  {item.accountDetails?.upiId && (
                    <div>
                      <span className="text-slate-400">Destination UPI ID: </span>
                      <span className="font-mono font-bold text-amber-400">{item.accountDetails.upiId}</span>
                    </div>
                  )}
                  {item.accountDetails?.accountNumber && (
                    <div>
                      <span className="text-slate-400">Bank A/C: </span>
                      <span className="font-mono font-bold text-white">{item.accountDetails.accountNumber}</span>
                      <span className="text-slate-400 ml-2">IFSC: </span>
                      <span className="font-mono font-bold text-amber-400">{item.accountDetails.ifsc}</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  Player: <span className="text-white font-bold">{item.user?.name}</span> ({item.user?.phone || item.user?.email}) • Total Deposited: ₹{item.user?.totalDeposited || 0}
                </div>

                {item.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleVerifyWithdrawal(item._id, 'reject')}
                      className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs hover:bg-rose-500/20"
                    >
                      Reject & Refund Balance
                    </button>
                    <button
                      onClick={() => handleVerifyWithdrawal(item._id, 'approve')}
                      className="py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      Approve Payout (Sent)
                    </button>
                  </div>
                )}
              </div>
            ))}

            {withdrawals.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-xs">
                No withdrawal requests found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: UPI SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleUpdateSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl">
          <span className="text-xs font-black text-white block uppercase tracking-wider">
            UPI Merchant & Deposit Settings
          </span>

          <div>
            <label className="text-[11px] text-slate-400">Admin Receiving UPI ID (VPA)</label>
            <input
              type="text"
              value={settings.upiId || ''}
              onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400">Merchant Name</label>
            <input
              type="text"
              value={settings.merchantName || ''}
              onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400">First Signup Free Bonus (₹)</label>
              <input
                type="number"
                value={settings.signupBonus || 50}
                onChange={(e) => setSettings({ ...settings, signupBonus: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Min Deposit (₹)</label>
              <input
                type="number"
                value={settings.minDeposit || 100}
                onChange={(e) => setSettings({ ...settings, minDeposit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider"
          >
            Save Settings
          </button>
        </form>
      )}

      {/* Adjust Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-base">Adjust Player Balance</h3>
            <p className="text-xs text-slate-400">
              User: <span className="text-white font-bold">{selectedUser.name}</span> (Current: ₹{selectedUser.balance})
            </p>

            <form onSubmit={handleUpdateBalance} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['add', 'deduct', 'set'].map((act) => (
                  <button
                    type="button"
                    key={act}
                    onClick={() => setEditAction(act)}
                    className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      editAction === act ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Amount (₹)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-black text-xs font-extrabold"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
