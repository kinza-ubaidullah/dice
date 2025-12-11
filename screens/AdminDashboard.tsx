
import React, { useState } from 'react';
import { Screen, User } from '../types';
import { LayoutDashboard, Users, Settings, LogOut, TrendingUp, DollarSign, Activity, PlayCircle, Save, Gamepad2, Search, Edit2, Trash2, ShieldOff, ShieldCheck, X } from 'lucide-react';
import NeonButton from '../components/NeonButton';

interface AdminDashboardProps {
  onLogout: () => void;
  commissionRate: number;
  setCommissionRate: (rate: number) => void;
  onEnterGame: () => void;
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    onLogout, commissionRate, setCommissionRate, onEnterGame, 
    users, onUpdateUser, onDeleteUser 
}) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'USERS' | 'SETTINGS'>('DASHBOARD');
  const [tempCommission, setTempCommission] = useState(commissionRate);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // User Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSaveSettings = () => {
    setCommissionRate(tempCommission);
    setSavedMessage("Configuration Saved Successfully!");
    setTimeout(() => setSavedMessage(null), 3000);
  };

  // --- STAT CALCS ---
  const totalRevenue = users.reduce((acc, u) => acc + (u.balance * 0.05), 0); // Simulated historical revenue
  const activePlayers = users.filter(u => !u.isBlocked).length;
  const totalBalance = users.reduce((acc, u) => acc + u.balance, 0);

  const stats = [
    { title: 'Total Revenue (Est.)', value: `${totalRevenue.toLocaleString()} CFA`, icon: <DollarSign className="text-gold" />, change: '+12%' },
    { title: 'Active Players', value: activePlayers.toString(), icon: <Users className="text-neon" />, change: 'Live' },
    { title: 'Total Player Funds', value: `${totalBalance.toLocaleString()} CFA`, icon: <Activity className="text-purple-400" />, change: 'Secure' },
  ];

  // --- HANDLERS ---
  const handleBlockToggle = (user: User) => {
      onUpdateUser({ ...user, isBlocked: !user.isBlocked });
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Are you sure you want to delete this user permanently?")) {
          onDeleteUser(id);
      }
  };

  const handleEditSave = () => {
      if (editingUser) {
          onUpdateUser(editingUser);
          setEditingUser(null);
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (activeTab === 'DASHBOARD') {
        return (
            <div className="space-y-6 animate-fade-in">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-panel border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-neonDim transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-black/40 rounded-lg border border-white/5">{stat.icon}</div>
                                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">{stat.change}</span>
                             </div>
                             <h3 className="text-textMuted text-sm font-bold uppercase tracking-wider">{stat.title}</h3>
                             <p className="text-2xl font-digital text-white font-bold mt-1">{stat.value}</p>
                             <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-white opacity-[0.02] rounded-full blur-xl group-hover:bg-neon group-hover:opacity-[0.05] transition-all"></div>
                        </div>
                    ))}
                </div>

                {/* Live Games */}
                <div className="bg-panel border border-gray-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="font-title text-lg text-white mb-4 flex items-center gap-2">
                        <PlayCircle className="text-neon" size={20} /> Live & Recent Games
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-textMuted uppercase border-b border-gray-700">
                                    <th className="py-3 px-2">Game ID</th>
                                    <th className="py-3 px-2">Player 1</th>
                                    <th className="py-3 px-2">Player 2</th>
                                    <th className="py-3 px-2">Bet Amount</th>
                                    <th className="py-3 px-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-300">
                                <tr className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-2 font-mono text-neonDim">#G-LIVE1</td>
                                    <td className="py-3 px-2">Admin User</td>
                                    <td className="py-3 px-2">NeonKing</td>
                                    <td className="py-3 px-2 font-bold text-white">500 CFA</td>
                                    <td className="py-3 px-2"><span className="text-danger animate-pulse font-bold text-[10px]">LIVE</span></td>
                                </tr>
                                <tr className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-2 font-mono text-neonDim">#G-8821</td>
                                    <td className="py-3 px-2">HHH HHH</td>
                                    <td className="py-3 px-2">Viper</td>
                                    <td className="py-3 px-2 font-bold text-white">1,000 CFA</td>
                                    <td className="py-3 px-2"><span className="text-gray-500 font-bold text-[10px]">ENDED</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'USERS') {
        return (
            <div className="bg-panel border border-gray-800 rounded-2xl p-6 shadow-lg animate-fade-in relative">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                     <h3 className="font-title text-lg text-white flex items-center gap-2">
                        <Users className="text-neon" size={20} /> User Database
                    </h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            placeholder="Search users..." 
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
                                <th className="py-4 px-4">Contact</th>
                                <th className="py-4 px-4">Balance</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-4 rounded-tr-lg text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="text-sm text-gray-300">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="border-b border-gray-800 hover:bg-white/5">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <img src={u.avatarUrl} className="w-8 h-8 rounded-full bg-gray-700" alt="" />
                                            <div>
                                                <p className="font-bold text-white">{u.name}</p>
                                                <p className="text-[10px] text-gray-500 font-mono">#{u.id.slice(0,6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p>{u.email}</p>
                                        <p className="text-xs text-gray-500">{u.phone || 'No Phone'}</p>
                                    </td>
                                    <td className="py-4 px-4 font-digital text-neon">{u.balance.toLocaleString()} CFA</td>
                                    <td className="py-4 px-4">
                                        <span className={`text-[10px] px-2 py-1 rounded border font-bold ${!u.isBlocked ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
                                            {u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingUser(u)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white" title="Edit">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleBlockToggle(u)} className={`p-2 rounded text-white ${u.isBlocked ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'}`} title={u.isBlocked ? "Unblock" : "Block"}>
                                                {u.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
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

                {/* EDIT USER MODAL OVERLAY */}
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
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Email</label>
                                    <input 
                                        value={editingUser.email} 
                                        onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-neon"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Phone</label>
                                    <input 
                                        value={editingUser.phone || ''} 
                                        onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-neon"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Wallet Balance</label>
                                    <input 
                                        type="number"
                                        value={editingUser.balance} 
                                        onChange={e => setEditingUser({...editingUser, balance: Number(e.target.value)})}
                                        className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-neon font-mono"
                                    />
                                </div>
                                <div className="pt-4">
                                    <NeonButton fullWidth onClick={handleEditSave}>SAVE CHANGES</NeonButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                             <label className="block text-sm font-bold text-textMuted uppercase">Game Commission Percentage</label>
                             <span className="text-xs text-neonDim">Current Active: {commissionRate}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="0" 
                                max="20" 
                                value={tempCommission} 
                                onChange={(e) => setTempCommission(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon"
                            />
                            <div className="w-16 h-12 flex items-center justify-center bg-black border border-neon rounded-lg font-digital text-xl text-neon">
                                {tempCommission}%
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Percentage taken from the winner's pot for each round.</p>
                    </div>

                    <div className="p-4 border border-gold/30 bg-gold/5 rounded-xl">
                        <h4 className="text-gold font-bold mb-2 flex items-center gap-2"><TrendingUp size={16}/> Revenue Projection</h4>
                        <p className="text-sm text-gray-300">Based on current volume, increasing commission to <span className="text-white font-bold">{tempCommission}%</span> would yield an estimated <span className="text-green-400 font-bold">{(tempCommission * 0.24).toFixed(1)}M CFA</span> monthly.</p>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <button 
                            onClick={handleSaveSettings}
                            className="bg-neon text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_#66FCF1] transition-all flex items-center gap-2"
                        >
                            <Save size={18} /> SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-white font-body">
      {/* Sidebar */}
      <aside className="w-64 bg-panel border-r border-gray-800 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-8">
            <h1 className="font-title text-2xl text-white">DICE <span className="text-neon">ADMIN</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <button 
                onClick={() => setActiveTab('DASHBOARD')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'DASHBOARD' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <LayoutDashboard size={20} /> Dashboard
            </button>
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Users size={20} /> Players
            </button>
             <button 
                onClick={() => setActiveTab('SETTINGS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-neon/10 text-neon border border-neon/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Settings size={20} /> Settings
            </button>

            {/* Enter Game Mode for Admin */}
            <div className="pt-6 mt-6 border-t border-gray-700/50">
                 <button 
                    onClick={onEnterGame}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gold hover:bg-gold/10 hover:text-white border border-gold/20"
                >
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-panel border-b border-gray-800 p-4 flex justify-between items-center">
             <h1 className="font-title text-xl text-white">ADMIN PANEL</h1>
             <button onClick={onLogout}><LogOut className="text-danger" /></button>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex bg-panel p-2 gap-2 overflow-x-auto">
             <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-neon text-black' : 'text-gray-400'}`}>Dashboard</button>
             <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'USERS' ? 'bg-neon text-black' : 'text-gray-400'}`}>Users</button>
             <button onClick={() => setActiveTab('SETTINGS')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-neon text-black' : 'text-gray-400'}`}>Settings</button>
             <button onClick={onEnterGame} className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap text-gold bg-gold/10 border border-gold/20">Game Mode</button>
        </div>

        <div className="p-6 md:p-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-1">
                    {activeTab === 'DASHBOARD' && 'Overview'}
                    {activeTab === 'USERS' && 'Player Database'}
                    {activeTab === 'SETTINGS' && 'Game Configuration'}
                </h2>
                <p className="text-textMuted text-sm">Welcome back, Administrator.</p>
            </div>
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
