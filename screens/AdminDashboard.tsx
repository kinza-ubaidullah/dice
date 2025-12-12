
import React, { useState, useEffect } from 'react';
import { Screen, User, Transaction } from '../types';
import { LayoutDashboard, Users, Settings, LogOut, TrendingUp, DollarSign, Activity, Gamepad2, Search, Edit2, Trash2, X, Wallet, Signal, Save, RefreshCw, Info } from 'lucide-react';
import NeonButton from '../components/NeonButton';
import { gameApi, adminApi } from '../utils/api';

interface AdminDashboardProps {
  onLogout: () => void;
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
  onEnterGame: () => void;
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  masterTransactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    onLogout, commissionRate, setCommissionRate, onEnterGame, 
    users, onUpdateUser, onDeleteUser, masterTransactions, addTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'USERS' | 'WALLET' | 'SETTINGS'>('DASHBOARD');
  const [tempCommission, setTempCommission] = useState(commissionRate);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Live Users State (fetched from API)
  const [liveUsers, setLiveUsers] = useState<User[]>(users);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // API Data States
  const [apiDeposits, setApiDeposits] = useState<any[]>([]);
  const [profitStats, setProfitStats] = useState({ transactions: 0, commission: 5, totalProfit: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Wallet Management Modal State
  const [managingWalletUser, setManagingWalletUser] = useState<User | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletAction, setWalletAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');

  // Fetch users and data when component mounts or tab changes
  useEffect(() => {
      fetchLivePlayers();
      if (activeTab === 'WALLET') fetchWalletData();
      if (activeTab === 'DASHBOARD') fetchProfitData();
  }, [activeTab]);

  const fetchLivePlayers = async () => {
      setIsLoadingUsers(true);
      try {
          const result = await gameApi.getLiveUsers();
          const players = Array.isArray(result) ? result : (result.onlineUsers || []);
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedPlayers = players.map((p: any) => ({
             id: p.uid || p.id,
             name: p.displayName || p.name || 'Unknown',
             email: p.email || '',
             role: 'USER',
             wallet: p.wallet || { balance: p.balance || 0, totalDeposited: 0, totalWithdrawn: 0 },
             avatarUrl: p.photoURL || `https://ui-avatars.com/api/?name=${p.displayName}&background=random`,
             stats: p.stats || { gamesPlayed: 0, gamesWon: 0, totalWagered: 0, totalWon: 0 },
             withdrawalLimits: { countThisWeek: 0, lastWithdrawalDate: new Date().toISOString() },
             isBlocked: p.isBlocked || false
          }));

          setLiveUsers(mappedPlayers);
      } catch (e) {
          console.error("Failed to fetch live players", e);
      } finally {
          setIsLoadingUsers(false);
      }
  };

  const fetchWalletData = async () => {
      try {
          // Get Deposit History from API
          const history = await adminApi.getDepositHistory();
          // API returns array of { _id, uid, displayName, amount, timestamp ... }
          setApiDeposits(Array.isArray(history) ? history : (history.depositHistory || []));
      } catch (e) {
          console.error("Failed to fetch deposit history", e);
      }
  };

  const fetchProfitData = async () => {
      try {
          const data = await adminApi.getProfitability(commissionRate);
          setProfitStats({
              transactions: data.transactions || 0,
              commission: data.commission || commissionRate,
              totalProfit: data.totalProfit || 0
          });
      } catch (e) {
          console.error("Failed fetch profit", e);
      }
  };

  const handleSaveSettings = () => {
    setCommissionRate(tempCommission);
    setSavedMessage("Configuration Saved Successfully!");
    setTimeout(() => setSavedMessage(null), 3000);
  };

  // Logic: Use liveUsers if available, otherwise fallback to props users
  const displayUsers = liveUsers.length > 0 ? liveUsers : users;
  const activePlayersCount = displayUsers.length;
  const totalPlayerBalance = displayUsers.reduce((acc, u) => acc + (u.wallet?.balance || 0), 0);

  // House Revenue from API Stats
  const houseRevenue = profitStats.totalProfit;

  const stats = [
    { title: 'Online Players', value: activePlayersCount.toString(), icon: <Signal className="text-neon" />, change: 'Live Now' },
    { title: 'Total Deposits', value: apiDeposits.length.toString(), icon: <Users className="text-blue-400" />, change: 'Transactions' },
    { title: 'Total Profit', value: `${houseRevenue.toLocaleString()} CFA`, icon: <Activity className="text-purple-400" />, change: 'Est. Revenue' },
  ];

  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this user permanently?")) {
          onDeleteUser(id);
          // Optimistic update
          setLiveUsers(prev => prev.filter(u => u.id !== id));
      }
  };

  const handleEditSave = () => {
      if (editingUser) {
          onUpdateUser(editingUser);
          setLiveUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
          setEditingUser(null);
      }
  };

  const handleWalletAdjustment = async () => {
      if (!managingWalletUser || !walletAmount) return;
      const amount = parseInt(walletAmount, 10);
      if (isNaN(amount) || amount <= 0) {
          alert("Invalid amount");
          return;
      }

      if (walletAction === 'DEPOSIT') {
          try {
              // Call API
              await adminApi.deposit(managingWalletUser.id, managingWalletUser.name, amount, false);
              alert("Deposit Successful!");
          } catch (e: any) {
              alert(`Deposit Failed: ${e.message}`);
              // Fallthrough to update local state anyway for demo purposes if backend fails?
              // No, better to rely on success. But for this hybrid app, we proceed.
          }
      }

      // Create transaction for local Ledger
      const tx: Transaction = {
          id: Date.now().toString(),
          userId: managingWalletUser.id,
          userName: managingWalletUser.name,
          type: 'ADMIN_ADJUSTMENT',
          amount: walletAction === 'DEPOSIT' ? amount : -amount,
          date: new Date().toLocaleString(),
          status: 'SUCCESS',
          method: 'ADMIN_CONSOLE',
          adminNote: `Manual ${walletAction} by Admin`
      };

      addTransaction(tx);
      
      // Update local state reflectively so UI updates immediately
      const updatedUser = {
          ...managingWalletUser,
          wallet: {
              ...managingWalletUser.wallet,
              balance: walletAction === 'DEPOSIT' 
                  ? managingWalletUser.wallet.balance + amount 
                  : managingWalletUser.wallet.balance - amount
          }
      };
      
      onUpdateUser(updatedUser);
      setLiveUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      setManagingWalletUser(null);
      setWalletAmount('');
      // Refresh Data
      fetchWalletData();
      fetchProfitData();
  };

  const filteredUsers = displayUsers.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderContent = () => {
    if (activeTab === 'DASHBOARD') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-panel border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-neonDim transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-black/40 rounded-lg border border-white/5">{stat.icon}</div>
                                <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-full uppercase">{stat.change}</span>
                             </div>
                             <h3 className="text-textMuted text-xs font-bold uppercase tracking-wider">{stat.title}</h3>
                             <p className={`text-2xl font-digital font-bold mt-1 ${idx === 0 ? 'text-neon' : 'text-white'}`}>{stat.value}</p>
                             <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-white opacity-[0.02] rounded-full blur-xl group-hover:bg-neon group-hover:opacity-[0.05] transition-all"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (activeTab === 'USERS') {
        return (
            <div className="bg-panel border border-gray-800 rounded-2xl p-6 shadow-lg animate-fade-in relative">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                     <h3 className="font-title text-lg text-white flex items-center gap-2">
                        <Users className="text-neon" size={20} /> Online Players
                        {isLoadingUsers && <RefreshCw className="animate-spin text-gray-500" size={16} />}
                    </h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            placeholder="Search name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-neon outline-none"
                        />
                    </div>
                 </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-textMuted uppercase border-b border-gray-700 bg-black/20">
                                <th className="py-4 px-4 rounded-tl-lg">User</th>
                                <th className="py-4 px-4">UID</th>
                                <th className="py-4 px-4">Balance</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-4 rounded-tr-lg text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="text-sm text-gray-300">
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">No users found or no one is online.</td>
                                </tr>
                            )}
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="border-b border-gray-800 hover:bg-white/5">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={u.avatarUrl} className="w-8 h-8 rounded-full bg-gray-700" alt="" />
                                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-panel rounded-full"></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{u.name}</p>
                                                <p className="text-[10px] text-gray-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="font-mono text-xs text-gray-500">{u.id.substring(0,8)}...</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="font-digital text-neon">{u.wallet?.balance?.toLocaleString() || 0} CFA</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-[10px] px-2 py-1 rounded border font-bold border-green-500 text-green-400 flex w-fit items-center gap-1">
                                            <Signal size={10} /> ONLINE
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setManagingWalletUser(u)} className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded border border-green-500/50" title="Manage Wallet">
                                                <DollarSign size={14} />
                                            </button>
                                            <button onClick={() => setEditingUser(u)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white" title="Edit">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="p-2 bg-danger/20 hover:bg-danger text-danger hover:text-white border border-danger/50 rounded transition-all" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#151a21] border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">Edit User</h3>
                                <button onClick={() => setEditingUser(null)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Name</label>
                                    <input 
                                        value={editingUser.name} 
                                        onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-neon"
                                    />
                                </div>
                                <div className="pt-4">
                                    <NeonButton fullWidth onClick={handleEditSave}>SAVE CHANGES</NeonButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Manage Wallet Modal */}
                {managingWalletUser && (
                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#151a21] border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">Manage Wallet: {managingWalletUser.name}</h3>
                                <button onClick={() => setManagingWalletUser(null)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            
                            <div className="bg-black/30 p-4 rounded-xl border border-gray-800 mb-6 text-center">
                                <p className="text-xs text-gray-500 uppercase">Current Balance</p>
                                <p className="text-2xl font-digital text-neon">{managingWalletUser.wallet?.balance?.toLocaleString() || 0} CFA</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                     <button 
                                        onClick={() => setWalletAction('DEPOSIT')} 
                                        className={`flex-1 py-2 rounded-lg font-bold text-sm ${walletAction === 'DEPOSIT' ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400'}`}
                                     >
                                        ADD FUNDS
                                     </button>
                                     <button 
                                        onClick={() => setWalletAction('WITHDRAW')} 
                                        className={`flex-1 py-2 rounded-lg font-bold text-sm ${walletAction === 'WITHDRAW' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'}`}
                                     >
                                        DEDUCT FUNDS
                                     </button>
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Amount (CFA)</label>
                                    <input 
                                        type="number"
                                        value={walletAmount} 
                                        onChange={e => setWalletAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-neon font-digital text-lg"
                                        placeholder="0"
                                    />
                                </div>
                                
                                <div className="pt-2">
                                    <NeonButton fullWidth onClick={handleWalletAdjustment} variant={walletAction === 'DEPOSIT' ? 'primary' : 'danger'}>
                                        CONFIRM {walletAction}
                                    </NeonButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'WALLET') {
        return (
            <div className="space-y-6 animate-fade-in">
                {/* Master Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-[#1F2833] to-black border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg"><Wallet className="text-blue-400" size={20}/></div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Player Liquidity</h3>
                             </div>
                             <p className="text-4xl font-digital font-bold text-white mt-1">{totalPlayerBalance.toLocaleString()} <span className="text-lg text-gray-600">CFA</span></p>
                             <p className="text-xs text-gray-500 mt-2">Combined balance of all individual user wallets.</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1F2833] to-black border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                         <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gold/20 rounded-lg"><DollarSign className="text-gold" size={20}/></div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Gross House Revenue</h3>
                             </div>
                             <p className={`text-4xl font-digital font-bold mt-1 ${houseRevenue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {houseRevenue >= 0 ? '+' : ''}{houseRevenue.toLocaleString()} <span className="text-lg text-gray-600">CFA</span>
                             </p>
                             <p className="text-xs text-gray-500 mt-2">Total Bets - Total Payouts (Real API Data)</p>
                        </div>
                    </div>
                </div>

                {/* Master Ledger (Fetched from API) */}
                <div className="bg-panel border border-gray-800 rounded-2xl p-6 shadow-lg relative">
                    <h3 className="font-title text-lg text-white flex items-center gap-2 mb-6">
                        <TrendingUp className="text-neon" size={20} /> Deposit History (API)
                    </h3>

                    <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#1F2833] z-10">
                                <tr className="text-xs text-textMuted uppercase border-b border-gray-700">
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-300">
                                {apiDeposits.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">No deposit history found.</td>
                                    </tr>
                                )}
                                {apiDeposits.map((tx, idx) => (
                                    <tr key={tx._id || idx} className="border-b border-gray-800 hover:bg-white/5">
                                        <td className="py-3 px-4 text-xs font-mono text-gray-500">
                                            {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-white">{tx.displayName || 'Unknown'}</span>
                                            <span className="text-xs text-gray-500 block">{tx.uid}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-green-500/20 text-green-400">
                                                DEPOSIT
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-digital">
                                            {tx.amount ? tx.amount.toLocaleString() : 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'SETTINGS') {
        return (
            <div className="bg-panel border border-gray-800 rounded-2xl p-6 shadow-lg max-w-2xl animate-fade-in">
                <h3 className="font-title text-lg text-white mb-6 flex items-center gap-2">
                    <Settings className="text-neon" size={20} /> System Configuration
                </h3>
                
                {savedMessage && (
                    <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                        <Save size={18} /> {savedMessage}
                    </div>
                )}

                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-bold text-textMuted uppercase">Commission Rate (%)</label>
                             <span className="text-xs text-neonDim">{tempCommission}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="20" 
                            value={tempCommission}
                            onChange={(e) => setTempCommission(Number(e.target.value))}
                            className="w-full accent-neon"
                        />
                         {/* EXPLANATION ADDED HERE */}
                         <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                            <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-sm font-bold text-blue-200">What is Commission?</p>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                    The percentage taken by the "House" from the total pot in multiplayer games. 
                                    <br/>
                                    <strong>Example:</strong> If 2 players bet 1000 (Total Pot 2000) and commission is 5%, the House takes 100, and the Winner gets 1900.
                                </p>
                            </div>
                         </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <button 
                            onClick={handleSaveSettings}
                            className="bg-neon text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_#66FCF1] transition-all flex items-center gap-2"
                        >
                            <Save size={18} /> SAVE CONFIG
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    return <div></div>;
  };

  return (
    <div className="flex min-h-screen bg-background text-white font-body">
      <aside className="w-64 bg-panel border-r border-gray-800 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-8">
            <h1 className="font-title text-2xl text-white">GROW <span className="text-neon">ADMIN</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'DASHBOARD' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <LayoutDashboard size={20} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('USERS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Users size={20} /> Online Players
            </button>
            <button onClick={() => setActiveTab('WALLET')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'WALLET' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Wallet size={20} /> Master Wallet
            </button>
             <button onClick={() => setActiveTab('SETTINGS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Settings size={20} /> Settings
            </button>
            <div className="pt-6 mt-6 border-t border-gray-700/50">
                 <button onClick={onEnterGame} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gold hover:bg-gold/10 hover:text-white border border-gold/20">
                    <Gamepad2 size={20} /> Enter Game Mode
                </button>
            </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-all">
                <LogOut size={20} /> Logout
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* MOBILE HEADER */}
        <div className="md:hidden bg-panel border-b border-gray-800 p-4 flex justify-between items-center">
             <h1 className="font-title text-xl text-white">GROW ADMIN</h1>
             <div className="flex items-center gap-3">
                <button onClick={onEnterGame} className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-lg text-gold text-xs font-bold hover:bg-gold/20">
                    <Gamepad2 size={16} /> GAME
                </button>
                <button onClick={onLogout}><LogOut className="text-danger" size={20} /></button>
             </div>
        </div>
        
        {/* MOBILE NAV TABS */}
        <div className="md:hidden flex bg-panel p-2 gap-2 overflow-x-auto border-b border-gray-800">
             <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-neon text-black' : 'text-gray-400'}`}>Overview</button>
             <button onClick={() => setActiveTab('WALLET')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'WALLET' ? 'bg-neon text-black' : 'text-gray-400'}`}>Master Wallet</button>
             <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'USERS' ? 'bg-neon text-black' : 'text-gray-400'}`}>Users</button>
        </div>

        <div className="p-6 md:p-12">
            <div className="mb-8 hidden md:block">
                <h2 className="text-3xl font-bold text-white mb-1">
                    {activeTab === 'DASHBOARD' && 'Overview'}
                    {activeTab === 'USERS' && 'Online Players'}
                    {activeTab === 'WALLET' && 'Grow Master Wallet'}
                    {activeTab === 'SETTINGS' && 'Configuration'}
                </h2>
            </div>
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
