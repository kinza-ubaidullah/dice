
import React, { useState, useRef } from 'react';
import { User, Screen } from '../types';
import NeonButton from '../components/NeonButton';
import { audioManager } from '../utils/audio';
import { 
    ChevronRight, User as UserIcon, Lock, Fingerprint, 
    Gamepad2, Download, Upload, Clock, Volume2, Globe, 
    Users, HelpCircle, Trash2, Shield, ChevronLeft, Check, VolumeX, AlertTriangle, Copy, Share2, Camera, AlertCircle, CheckCircle, Smartphone, Edit2, X
} from 'lucide-react';

interface ProfileScreenProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setScreen: (screen: Screen) => void;
  onLogout: () => void;
  registeredUsers?: User[];
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (id: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

type ProfileView = 'MENU' | 'EDIT_PROFILE' | 'CHANGE_PASSWORD' | 'TWO_FACTOR' | 'SOUND' | 'LANGUAGE' | 'REFERRAL' | 'FAQ' | 'MANAGE_ACCOUNTS' | 'PRIVACY';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
    user, setUser, setScreen, onLogout, registeredUsers = [], onUpdateUser, onDeleteUser,
    language, setLanguage
}) => {
  const [currentView, setCurrentView] = useState<ProfileView>('MENU');

  // Translation Helper
  const t = (key: string) => {
    if (language === 'Français') {
        const dictionary: Record<string, string> = {
            'Account Settings': 'Paramètres du compte',
            'PROFILE': 'PROFIL',
            'CHANGE PASSWORD': 'CHANGER LE MOT DE PASSE',
            'TWO FACTOR AUTHENTICATION': 'DOUBLE AUTHENTIFICATION',
            'General': 'Général',
            'GAME LOG': 'HISTORIQUE DE JEU',
            'MY DEPOSIT': 'DÉPÔT',
            'WITHDRAWALS': 'RETRAITS',
            'TRANSACTION': 'TRANSACTIONS',
            'SOUND': 'SON',
            'LANGUAGE': 'LANGUE',
            'REFERRAL': 'PARRAINAGE',
            'FAQ': 'AIDE & FAQ',
            'MANAGE ACCOUNTS': 'GÉRER LES COMPTES',
            'Legal': 'Légal',
            'PRIVACY & POLICY': 'POLITIQUE DE CONFIDENTIALITÉ',
            'LOGOUT': 'DÉCONNEXION',
            'Profile': 'Profil',
            'Edit Profile': 'Modifier le Profil',
            'Change Password': 'Changer le mot de passe',
            'Sound Settings': 'Paramètres Audio',
            'Language': 'Langue',
            'Referral Program': 'Programme de Parrainage',
            'Help & FAQ': 'Aide',
            'Manage Accounts': 'Gestion des Comptes',
            'Privacy Policy': 'Confidentialité'
        };
        return dictionary[key] || key;
    }
    return key;
  };
  
  // --- SUB-SCREENS ---

  const EditProfileView = () => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
    
    // Validation State
    const [errors, setErrors] = useState<{name?: string, email?: string, phone?: string}>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors: any = {};
        
        // Name Validation
        if (name.trim().length < 3) {
            newErrors.name = "Name must be at least 3 characters long.";
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        // Phone Validation (Simple check for length and digits)
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            newErrors.phone = "Please enter a valid phone number (8-15 digits).";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            const updated = { 
                ...user, 
                name, 
                email, 
                phone,
                avatarUrl: avatarPreview 
            };
            setUser(updated);
            if (onUpdateUser) onUpdateUser(updated);
            
            alert("Profile Updated Successfully!");
            setCurrentView('MENU');
        } else {
            audioManager.play('LOSS'); // Error sound
        }
    };

    return (
        <div className="flex flex-col h-full pt-2 overflow-y-auto pb-6">
            
            {/* Profile Pic Upload */}
            <div className="flex flex-col items-center mb-8">
                <div 
                    className="relative w-28 h-28 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-neonDim to-neon shadow-[0_0_20px_rgba(102,252,241,0.3)]">
                        <img 
                            src={avatarPreview} 
                            alt="Profile" 
                            className="w-full h-full rounded-full bg-black object-cover" 
                        />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={32} />
                    </div>
                    
                    {/* Edit Badge */}
                    <div className="absolute bottom-0 right-0 bg-neon text-black p-2 rounded-full border-2 border-[#0B0C10]">
                        <Camera size={16} />
                    </div>
                </div>
                <p className="text-textMuted text-xs mt-3">Tap image to change</p>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload} 
                />
            </div>

            <div className="space-y-6 flex-1">
                {/* Name Input */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Display Name</label>
                        {errors.name && <span className="text-[10px] text-danger font-bold flex items-center gap-1"><AlertCircle size={10} /> Invalid</span>}
                    </div>
                    <div className="relative group">
                        <input 
                            value={name} onChange={e => setName(e.target.value)}
                            className={`w-full bg-[#151a21] border rounded-xl px-5 py-4 text-white text-base placeholder-gray-600 outline-none transition-all font-medium ${errors.name ? 'border-danger/50 focus:border-danger' : 'border-gray-700 focus:border-neon focus:shadow-[0_0_15px_rgba(102,252,241,0.1)]'}`}
                            placeholder="Enter your name"
                        />
                    </div>
                    <p className={`text-[10px] px-2 ${errors.name ? 'text-danger' : 'text-gray-500'}`}>
                        {errors.name || "Visible to other players in the lobby and game rooms."}
                    </p>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                         {errors.email && <span className="text-[10px] text-danger font-bold flex items-center gap-1"><AlertCircle size={10} /> Invalid</span>}
                    </div>
                    <div className="relative group">
                        <input 
                            value={email} onChange={e => setEmail(e.target.value)}
                            className={`w-full bg-[#151a21] border rounded-xl px-5 py-4 text-white text-base placeholder-gray-600 outline-none transition-all font-medium ${errors.email ? 'border-danger/50 focus:border-danger' : 'border-gray-700 focus:border-neon focus:shadow-[0_0_15px_rgba(102,252,241,0.1)]'}`}
                            placeholder="Enter your email"
                        />
                    </div>
                    <p className={`text-[10px] px-2 ${errors.email ? 'text-danger' : 'text-gray-500'}`}>
                        {errors.email || "Used for account recovery and login."}
                    </p>
                </div>

                {/* Phone Input */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                         {errors.phone && <span className="text-[10px] text-danger font-bold flex items-center gap-1"><AlertCircle size={10} /> Invalid</span>}
                    </div>
                    <div className="relative group">
                         <input 
                            value={phone} onChange={e => setPhone(e.target.value)}
                            className={`w-full bg-[#151a21] border rounded-xl px-5 py-4 text-white text-base placeholder-gray-600 outline-none transition-all font-medium ${errors.phone ? 'border-danger/50 focus:border-danger' : 'border-gray-700 focus:border-neon focus:shadow-[0_0_15px_rgba(102,252,241,0.1)]'}`}
                            placeholder="Enter phone number"
                        />
                    </div>
                    <p className={`text-[10px] px-2 ${errors.phone ? 'text-danger' : 'text-gray-500'}`}>
                        {errors.phone || "Required for Mobile Money transactions."}
                    </p>
                </div>
            </div>

            <div className="mt-8 mb-4">
                <NeonButton 
                    fullWidth 
                    onClick={handleSave} 
                    className="shadow-[0_0_30px_rgba(102,252,241,0.4)] py-4 text-lg hover:shadow-[0_0_40px_rgba(102,252,241,0.6)]"
                >
                    SAVE CHANGES
                </NeonButton>
            </div>
        </div>
    );
  };

  const ChangePasswordView = () => {
      const [oldPass, setOldPass] = useState('');
      const [newPass, setNewPass] = useState('');
      const [confirmPass, setConfirmPass] = useState('');
      const [error, setError] = useState<string | null>(null);

      const handleUpdate = () => {
          setError(null);
          
          if (!oldPass || !newPass || !confirmPass) {
              setError("All fields are required.");
              return;
          }

          if (oldPass !== user.password) {
              setError("Incorrect current password.");
              return;
          }

          if (newPass.length < 8) {
              setError("Password must be at least 8 characters long.");
              return;
          }

          if (newPass !== confirmPass) {
              setError("New passwords do not match.");
              return;
          }
          
          const updated = { ...user, password: newPass };
          setUser(updated);
          if (onUpdateUser) onUpdateUser(updated);

          alert("Password updated successfully!");
          setCurrentView('MENU');
      };

      const inputStyle = "w-full bg-[#151a21] border border-gray-700 rounded-xl px-5 py-4 text-white text-base focus:border-neon focus:shadow-[0_0_15px_rgba(102,252,241,0.1)] outline-none transition-all placeholder-gray-600";

      return (
          <div className="flex flex-col h-full pt-2">
              <div className="space-y-6 flex-1">
                
                {error && (
                    <div className="bg-danger/10 border border-danger/50 rounded-xl p-3 flex items-center gap-2 text-danger text-xs font-bold animate-fade-in">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Current Password</label>
                    <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className={inputStyle} placeholder="••••••••" />
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputStyle} placeholder="••••••••" />
                    <p className="text-[10px] text-gray-500 px-2 flex items-center gap-1">
                        <CheckCircle size={10} className={newPass.length >= 8 ? "text-green-500" : "text-gray-600"} /> 
                        Must be at least 8 characters long.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm New Password</label>
                    <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputStyle} placeholder="••••••••" />
                </div>
              </div>

              <div className="mt-8 mb-4">
                  <NeonButton 
                    fullWidth 
                    onClick={handleUpdate} 
                    className="shadow-[0_0_30px_rgba(102,252,241,0.4)] py-4 text-lg hover:shadow-[0_0_40px_rgba(102,252,241,0.6)]"
                  >
                    UPDATE PASSWORD
                  </NeonButton>
              </div>
          </div>
      );
  };

  const TwoFactorView = () => {
      const [isEnabled, setIsEnabled] = useState(false);
      return (
          <div className="flex flex-col h-full pt-4">
              <div className="bg-[#151a21] border border-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-8 flex-1 relative overflow-hidden">
                  
                  {/* Status Indicator Ring */}
                  <div className={`relative w-40 h-40 flex items-center justify-center rounded-full border-4 transition-all duration-500 ${isEnabled ? 'border-neon bg-neon/5 shadow-[0_0_40px_rgba(102,252,241,0.2)]' : 'border-gray-700 bg-gray-900'}`}>
                      <div className={`absolute inset-0 rounded-full border border-dashed border-white/20 animate-spin-slow`}></div>
                      <Shield size={64} className={`transition-colors duration-300 ${isEnabled ? 'text-neon' : 'text-gray-600'}`} />
                      
                      {isEnabled && <div className="absolute top-2 right-4 text-neon animate-pulse"><CheckCircle size={24} fill="black" /></div>}
                  </div>

                  <div className="text-center space-y-3 z-10">
                    <h3 className={`text-2xl font-bold transition-colors ${isEnabled ? 'text-white' : 'text-gray-400'}`}>
                        {isEnabled ? 'Protection Active' : 'Protection Disabled'}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
                        {isEnabled 
                            ? 'Your account is currently protected. Withdrawals will require confirmation.' 
                            : 'Enable 2FA to add an extra security layer to your withdrawals and account changes.'
                        }
                    </p>
                  </div>
                  
                  {/* Background decoration */}
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
              </div>

              <div className="mt-6 mb-4">
                <NeonButton 
                    variant={isEnabled ? 'danger' : 'primary'} 
                    onClick={() => setIsEnabled(!isEnabled)} 
                    fullWidth
                    className={isEnabled ? "shadow-[0_0_30px_rgba(255,76,76,0.4)]" : "shadow-[0_0_30px_rgba(102,252,241,0.4)]"}
                >
                    {isEnabled ? 'DISABLE 2FA' : 'ENABLE 2FA'}
                </NeonButton>
              </div>
          </div>
      );
  };

  const SoundView = () => {
      const [muted, setMuted] = useState(audioManager.isMuted());
      
      const toggle = () => {
          const newState = audioManager.toggleMute();
          setMuted(newState);
      };

      return (
          <div className="pt-4 space-y-6">
              <div className="bg-[#151a21] border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-neon transition-opacity opacity-0 group-hover:opacity-100"></div>
                  
                  <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${muted ? 'bg-red-500/10 text-red-500' : 'bg-neon/10 text-neon shadow-[0_0_15px_rgba(102,252,241,0.2)]'}`}>
                          {muted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                      </div>
                      <div>
                          <p className="font-title text-lg text-white tracking-wide">Master Audio</p>
                          <p className="text-xs text-textMuted mt-1">Controls all in-game sound effects</p>
                      </div>
                  </div>

                  {/* Custom Toggle Switch */}
                  <button onClick={toggle} className={`relative w-16 h-8 rounded-full transition-all duration-300 ${muted ? 'bg-gray-800 border border-gray-600' : 'bg-neonDim/30 border border-neon'}`}>
                      <div className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${muted ? 'translate-x-0 bg-gray-400' : 'translate-x-8 bg-neon'}`}>
                        {!muted && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
                      </div>
                  </button>
              </div>

              <div className="bg-panel/50 border border-gray-800 rounded-xl p-6 text-center">
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">Volume Levels</p>
                  {/* Fake Visualizer */}
                  <div className="flex justify-center items-end gap-1 h-12">
                      {[1,3,2,5,3,6,4,2,3,5,2,1].map((h, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 rounded-t-sm transition-all duration-500 ${muted ? 'bg-gray-800 h-1' : 'bg-neon animate-pulse'}`}
                            style={{ height: muted ? '4px' : `${h * 6}px`, animationDelay: `${i * 0.1}s` }}
                          ></div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  const LanguageView = () => {
      const languages = [
          { name: 'English', flag: '🇬🇧', region: 'Global' },
          { name: 'Français', flag: '🇫🇷', region: 'Europe/Afrique' }
      ];
      
      return (
          <div className="grid grid-cols-1 gap-3 pt-2">
              {languages.map(l => (
                  <button 
                    key={l.name} 
                    onClick={() => setLanguage(l.name)} 
                    className={`group w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                        language === l.name 
                        ? 'bg-[#151a21] border-neon shadow-[0_0_15px_rgba(102,252,241,0.1)]' 
                        : 'bg-[#151a21] border-gray-800 hover:border-gray-600'
                    }`}
                  >
                      <div className="flex items-center gap-4">
                          <span className="text-2xl">{l.flag}</span>
                          <div className="text-left">
                              <p className={`font-bold transition-colors ${language === l.name ? 'text-neon' : 'text-white'}`}>{l.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{l.region}</p>
                          </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          language === l.name ? 'border-neon bg-neon text-black' : 'border-gray-600 bg-transparent'
                      }`}>
                          {language === l.name && <Check size={14} strokeWidth={4} />}
                      </div>
                  </button>
              ))}
          </div>
      );
  };

  const ReferralView = () => {
      const code = `REF-${Math.floor(Math.random()*10000)}`;
      return (
          <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/50 to-panel border border-purple-500/30 p-6 rounded-2xl text-center">
                  <h3 className="text-purple-400 font-bold tracking-widest uppercase mb-2">Your Referral Code</h3>
                  <div className="bg-black/50 border border-purple-500/50 rounded-xl p-4 flex items-center justify-between mb-4">
                      <span className="font-digital text-2xl text-white tracking-wider">{code}</span>
                      <button className="text-purple-400 hover:text-white" onClick={() => alert("Copied!")}><Copy size={20}/></button>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Share this code with friends. You get 10% of their first deposit!</p>
                  <NeonButton fullWidth variant="primary" onClick={() => alert("Shared!")} className="flex items-center justify-center gap-2">
                      <Share2 size={18} /> SHARE NOW
                  </NeonButton>
              </div>
              
              <div>
                  <h4 className="text-white font-bold mb-3">Referral History</h4>
                  <div className="bg-panel border border-gray-800 rounded-xl p-8 text-center text-textMuted">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No referrals yet.</p>
                  </div>
              </div>
          </div>
      );
  };

  const FAQView = () => {
      const faqs = [
          { q: "How do I deposit funds?", a: "Go to the Wallet section, click Deposit, enter amount and select your payment method (MTN/Moov)." },
          { q: "Is this game fair?", a: "Yes, we use a provably fair random number generation system." },
          { q: "How fast are withdrawals?", a: "Withdrawals are processed instantly but may take up to 5 minutes depending on network congestion." },
          { q: "Can I play on multiple devices?", a: "Yes, just login with your credentials on any device." }
      ];

      return (
          <div className="space-y-3">
              {faqs.map((item, i) => (
                  <div key={i} className="bg-panel border border-gray-800 rounded-xl p-4">
                      <h4 className="font-bold text-neon mb-2 text-sm">{item.q}</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">{item.a}</p>
                  </div>
              ))}
          </div>
      );
  };

  const ManageAccountsView = () => {
      const [editingUser, setEditingUser] = useState<User | null>(null);
      const [editForm, setEditForm] = useState<Partial<User>>({});

      const handleDelete = (e: React.MouseEvent, targetUser: User) => {
          e.stopPropagation(); // CRITICAL: Stop the click from bubbling to the parent
          e.preventDefault();
          if (window.confirm(`Are you sure you want to delete ${targetUser.name}? This action is permanent.`)) {
              if (onDeleteUser) onDeleteUser(targetUser.id);
          }
      };

      const startEditing = (e: React.MouseEvent, u: User) => {
          e.stopPropagation(); // CRITICAL: Stop bubbling
          e.preventDefault();
          setEditingUser(u);
          setEditForm({...u});
      };

      const handleRowClick = (u: User) => {
          setEditingUser(u);
          setEditForm({...u});
      }

      const handleEditSave = () => {
          if (editingUser && onUpdateUser) {
              const updatedUser = { ...editingUser, ...editForm } as User;
              onUpdateUser(updatedUser);
              setEditingUser(null);
              setEditForm({});
          }
      };

      if (editingUser) {
          const inputStyle = "w-full bg-[#151a21] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-neon outline-none transition-all placeholder-gray-600";
          return (
              <div className="flex flex-col h-full space-y-4 pt-2">
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-bold text-lg">Edit User Details</h3>
                      <button onClick={() => setEditingUser(null)} className="p-2 rounded-full hover:bg-white/10"><X className="text-gray-400 hover:text-white" size={20} /></button>
                  </div>
                  
                  <div className="flex justify-center my-4">
                      <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden border-2 border-neon">
                          <img src={editForm.avatarUrl || editingUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                  </div>

                  <div className="space-y-4 overflow-y-auto pb-4">
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Full Name</label>
                          <input 
                            className={inputStyle}
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Email</label>
                          <input 
                            className={inputStyle} 
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Phone</label>
                          <input 
                            className={inputStyle}
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Reset Password</label>
                          <input 
                            className={inputStyle}
                            type="password"
                            placeholder="Enter new password"
                            value={editForm.password || ''}
                            onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                          />
                      </div>
                       <div className="pt-4">
                           <NeonButton fullWidth onClick={handleEditSave}>SAVE CHANGES</NeonButton>
                       </div>
                  </div>
              </div>
          );
      }

      return (
          <div className="flex flex-col h-full space-y-4 overflow-y-auto pt-2">
              <div className="flex items-center gap-2 mb-2 text-textMuted text-xs">
                  <Users size={14} />
                  <span>{registeredUsers.length} Registered Accounts</span>
              </div>
              
              <div className="space-y-3 pb-6">
                {registeredUsers.map((u) => (
                    <div 
                        key={u.id} 
                        onClick={() => handleRowClick(u)}
                        className="bg-panel border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${u.id === user.id ? 'text-neon' : 'text-white'}`}>
                                    {u.name} {u.id === user.id && '(You)'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{u.role === 'ADMIN' ? 'Administrator' : u.email}</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons - Always Visible now to fix interaction issues */}
                        <div className="flex gap-2 ml-2">
                            <button 
                                onClick={(e) => startEditing(e, u)} 
                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/30 transition-colors z-10"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, u)} 
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/30 transition-colors z-10"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
              </div>
          </div>
      );
  };

  const PrivacyView = () => (
      <div className="bg-panel border border-gray-800 rounded-xl p-4 text-gray-300 text-sm leading-relaxed space-y-4 h-[60vh] overflow-y-auto">
          <p><strong>1. Introduction</strong><br/>Welcome to Large Number. By using our app, you agree to these terms.</p>
          <p><strong>2. Data Collection</strong><br/>We collect minimal data necessary for account management and transaction processing.</p>
          <p><strong>3. Security</strong><br/>We use industry-standard encryption to protect your personal information and financial data.</p>
          <p><strong>4. Responsible Gaming</strong><br/>We encourage responsible gaming. If you feel you have a problem, please contact support.</p>
          <p>This is a mock policy for demonstration purposes.</p>
      </div>
  );


  // --- MAIN RENDER LOGIC ---

  const renderContent = () => {
    switch(currentView) {
        case 'EDIT_PROFILE': return <EditProfileView />;
        case 'CHANGE_PASSWORD': return <ChangePasswordView />;
        case 'TWO_FACTOR': return <TwoFactorView />;
        case 'SOUND': return <SoundView />;
        case 'LANGUAGE': return <LanguageView />;
        case 'REFERRAL': return <ReferralView />;
        case 'FAQ': return <FAQView />;
        case 'MANAGE_ACCOUNTS': return <ManageAccountsView />;
        case 'PRIVACY': return <PrivacyView />;
        default: return null;
    }
  };

  const getTitle = () => {
     switch(currentView) {
        case 'EDIT_PROFILE': return t('Edit Profile');
        case 'CHANGE_PASSWORD': return t('Change Password');
        case 'TWO_FACTOR': return t('Two Factor Auth');
        case 'SOUND': return t('Sound Settings');
        case 'LANGUAGE': return t('Language');
        case 'REFERRAL': return t('Referral Program');
        case 'FAQ': return t('Help & FAQ');
        case 'MANAGE_ACCOUNTS': return t('Manage Accounts');
        case 'PRIVACY': return t('Privacy Policy');
        default: return t('Profile');
     }
  };

  const MenuItem = ({ icon: Icon, label, onClick, isDanger = false }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 border-b border-gray-800 hover:bg-white/5 transition-colors group"
    >
        <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDanger ? 'text-danger bg-danger/10' : 'text-neonDim bg-neonDim/10'}`}>
                <Icon size={18} />
            </div>
            <span className={`font-bold text-sm tracking-wide ${isDanger ? 'text-danger' : 'text-white'}`}>{t(label)}</span>
        </div>
        <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
    </button>
  );

  return (
    <div className="flex flex-col min-h-full bg-background animate-fade-in pb-12">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-b from-panel to-background border-b border-gray-800 flex items-center sticky top-0 z-20 shadow-md">
            {currentView !== 'MENU' ? (
                <button onClick={() => setCurrentView('MENU')} className="mr-4 text-textMuted hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
            ) : (
                <div className="w-6"></div> // Spacer
            )}
            <h1 className="font-title text-xl text-white flex-1 text-center pr-6 uppercase tracking-wider">{getTitle()}</h1>
        </div>

        {currentView === 'MENU' ? (
            // MAIN MENU
            <>
                <div className="p-6 flex items-center justify-between border-b border-gray-800 bg-[#151a21]">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-neonDim">
                            <img src={user.avatarUrl} alt="User" className="w-full h-full rounded-full bg-black object-cover" />
                        </div>
                        <div>
                            <h1 className="font-title text-xl text-white italic tracking-wider uppercase">{user.name}</h1>
                            <p className="text-xs text-textMuted">{user.email || 'user@example.com'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Account Group */}
                    <div>
                        <h2 className="text-textMuted text-xs font-bold uppercase tracking-widest mb-3 ml-2">{t('Account Settings')}</h2>
                        <div className="bg-panel rounded-2xl overflow-hidden border border-gray-800">
                            <MenuItem icon={UserIcon} label="PROFILE" onClick={() => setCurrentView('EDIT_PROFILE')} />
                            <MenuItem icon={Lock} label="CHANGE PASSWORD" onClick={() => setCurrentView('CHANGE_PASSWORD')} />
                            <MenuItem icon={Fingerprint} label="TWO FACTOR AUTHENTICATION" onClick={() => setCurrentView('TWO_FACTOR')} />
                        </div>
                    </div>

                    {/* General Group */}
                    <div>
                         <h2 className="text-textMuted text-xs font-bold uppercase tracking-widest mb-3 ml-2">{t('General')}</h2>
                        <div className="bg-panel rounded-2xl overflow-hidden border border-gray-800">
                            <MenuItem icon={Gamepad2} label="GAME LOG" onClick={() => setScreen(Screen.HISTORY)} />
                            <MenuItem icon={Download} label="MY DEPOSIT" onClick={() => setScreen(Screen.WALLET)} />
                            <MenuItem icon={Upload} label="WITHDRAWALS" onClick={() => setScreen(Screen.WALLET)} />
                            <MenuItem icon={Clock} label="TRANSACTION" onClick={() => setScreen(Screen.WALLET)} />
                            <MenuItem icon={Volume2} label="SOUND" onClick={() => setCurrentView('SOUND')} />
                            <MenuItem icon={Globe} label="LANGUAGE" onClick={() => setCurrentView('LANGUAGE')} />
                            <MenuItem icon={Users} label="REFERRAL" onClick={() => setCurrentView('REFERRAL')} />
                            <MenuItem icon={HelpCircle} label="FAQ" onClick={() => setCurrentView('FAQ')} />
                            <MenuItem icon={Users} label="MANAGE ACCOUNTS" onClick={() => setCurrentView('MANAGE_ACCOUNTS')} />
                        </div>
                    </div>

                    {/* Policy */}
                    <div>
                         <h2 className="text-textMuted text-xs font-bold uppercase tracking-widest mb-3 ml-2">{t('Legal')}</h2>
                        <div className="bg-panel rounded-2xl overflow-hidden border border-gray-800">
                            <MenuItem icon={Shield} label="PRIVACY & POLICY" onClick={() => setCurrentView('PRIVACY')} />
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="pt-4">
                        <button 
                            onClick={onLogout}
                            className="w-full bg-danger text-white font-title py-4 rounded-xl font-bold tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                        >
                            {t('LOGOUT')}
                        </button>
                    </div>
                </div>
            </>
        ) : (
            // SUB SCREENS CONTAINER
            <div className="p-6 h-full">
                {renderContent()}
            </div>
        )}
    </div>
  );
};

export default ProfileScreen;
