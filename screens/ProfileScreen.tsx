
import React, { useState, useRef } from 'react';
import { User, Screen } from '../types';
import NeonButton from '../components/NeonButton';
import { audioManager } from '../utils/audio';
import { 
    ChevronRight, User as UserIcon, Lock, 
    Download, Upload, Volume2, Globe, 
    Camera, Edit2, Shield, Activity, Mail, Phone, ChevronLeft, VolumeX, Play, LayoutDashboard
} from 'lucide-react';
import { translate } from '../utils/i18n';

interface ProfileScreenProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setScreen: (screen: Screen) => void;
  onLogout: () => void;
  onUpdateUser?: (user: User) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

type ProfileView = 'MENU' | 'EDIT_PROFILE' | 'CHANGE_PASSWORD' | 'LANGUAGE' | 'SOUND';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
    user, setUser, setScreen, onLogout, onUpdateUser,
    language, setLanguage
}) => {
  const [currentView, setCurrentView] = useState<ProfileView>('MENU');
  const t = (key: string) => translate(key, language);
  
  // Calculate Win Rate
  const winRate = user.stats.gamesPlayed > 0 
    ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) 
    : 0;

  // --- SUB-SCREENS ---

  const EditProfileView = () => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phone || '');
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
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

    const handleSave = () => {
        if (name.trim().length < 3) {
             alert("Name too short.");
             return;
        }

        const updated = { 
            ...user, 
            name, 
            email,
            phone,
            avatarUrl: avatarPreview 
        };
        setUser(updated);
        if (onUpdateUser) onUpdateUser(updated);
        
        alert("Profile Updated!");
        setCurrentView('MENU');
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto animate-fade-in-up">
            <div className="flex flex-col items-center mb-8 mt-4">
                <div 
                    className="relative w-32 h-32 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-neonDim to-neon shadow-[0_0_30px_rgba(102,252,241,0.4)]">
                        <img src={avatarPreview} alt="Profile" className="w-full h-full rounded-full bg-black object-cover" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-neon text-black p-2 rounded-full border-4 border-[#0B0C10] shadow-lg group-hover:scale-110 transition-transform">
                        <Camera size={18} />
                    </div>
                </div>
                <p className="text-textMuted text-xs mt-3 uppercase tracking-widest">Tap to change photo</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>

            <div className="space-y-4 px-2">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Full Name</label>
                    <div className="bg-[#151a21] border border-gray-700 rounded-xl flex items-center px-4 focus-within:border-neon transition-colors">
                        <UserIcon size={18} className="text-gray-500" />
                        <input 
                            value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-transparent border-none py-4 pl-3 text-white outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email</label>
                    <div className="bg-[#151a21] border border-gray-700 rounded-xl flex items-center px-4 focus-within:border-neon transition-colors">
                        <Mail size={18} className="text-gray-500" />
                        <input 
                            value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full bg-transparent border-none py-4 pl-3 text-white outline-none"
                            placeholder="user@example.com"
                            readOnly
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Phone</label>
                    <div className="bg-[#151a21] border border-gray-700 rounded-xl flex items-center px-4 focus-within:border-neon transition-colors">
                        <Phone size={18} className="text-gray-500" />
                        <input 
                            value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full bg-transparent border-none py-4 pl-3 text-white outline-none"
                            placeholder="+27..."
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <NeonButton fullWidth onClick={handleSave}>SAVE CHANGES</NeonButton>
            </div>
        </div>
    );
  };

  const ChangePasswordView = () => {
      return (
          <div className="flex flex-col h-full pt-4 animate-fade-in-up items-center justify-center text-center">
              <Lock size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 max-w-xs">Password management is now handled via secure email verification. Please use the "Forgot Password" link on the login screen.</p>
          </div>
      );
  };

  const SoundView = () => {
      const [testPlaying, setTestPlaying] = useState(false);
      
      const handleTestSound = () => {
          // Explicitly wake up the audio context on user gesture
          audioManager.resume();
          audioManager.play('SUCCESS');
          setTestPlaying(true);
          setTimeout(() => setTestPlaying(false), 1000);
      };

      return (
          <div className="flex flex-col gap-6 pt-4 animate-fade-in-up">
               <div className="bg-panel border border-gray-800 rounded-xl p-6 text-center">
                    <h3 className="text-white font-bold text-lg mb-2">Audio System</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        If you are not hearing sounds, please click the button below to authorize audio playback for your browser.
                    </p>
                    
                    <button 
                        onClick={handleTestSound}
                        className={`
                            mx-auto w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all
                            ${testPlaying ? 'bg-neon text-black border-neon scale-110 shadow-[0_0_30px_#66FCF1]' : 'bg-gray-800 text-white border-gray-600 hover:border-white'}
                        `}
                    >
                        {testPlaying ? <Volume2 size={40} /> : <Play size={40} className="ml-1" />}
                    </button>
                    <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest font-bold">
                        {testPlaying ? 'PLAYING...' : 'TAP TO TEST'}
                    </p>
               </div>

               <div className="bg-panel border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <VolumeX size={20} className="text-gray-400" />
                       <span className="text-sm font-bold text-white">Mute All Sounds</span>
                   </div>
                   {/* Toggle Switch */}
                   <button 
                        onClick={() => audioManager.toggleMute()}
                        className={`w-12 h-6 rounded-full relative transition-colors ${audioManager.isMuted() ? 'bg-neon' : 'bg-gray-700'}`}
                   >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${audioManager.isMuted() ? 'right-1' : 'left-1'}`}></div>
                   </button>
               </div>
          </div>
      );
  };

  const LanguageView = () => {
      const languages = [
          { name: 'English', flag: '🇬🇧', region: 'International' },
          { name: 'Français', flag: '🇫🇷', region: 'Afrique Francophone' }
      ];
      
      return (
          <div className="grid grid-cols-1 gap-4 pt-4 animate-fade-in-up">
              {languages.map(l => (
                  <button 
                    key={l.name} 
                    onClick={() => { setLanguage(l.name); setCurrentView('MENU'); }} 
                    className={`group w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                        language === l.name 
                        ? 'bg-neon/10 border-neon shadow-[0_0_15px_rgba(102,252,241,0.2)]' 
                        : 'bg-[#151a21] border-gray-800 hover:border-gray-600'
                    }`}
                  >
                      <div className="flex items-center gap-4">
                          <span className="text-3xl">{l.flag}</span>
                          <div className="text-left">
                              <p className={`font-bold text-lg transition-colors ${language === l.name ? 'text-neon' : 'text-white'}`}>{l.name}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{l.region}</p>
                          </div>
                      </div>
                      {language === l.name && <div className="w-3 h-3 rounded-full bg-neon shadow-[0_0_10px_#66FCF1]"></div>}
                  </button>
              ))}
          </div>
      );
  };

  const renderContent = () => {
    switch(currentView) {
        case 'EDIT_PROFILE': return <EditProfileView />;
        case 'CHANGE_PASSWORD': return <ChangePasswordView />;
        case 'LANGUAGE': return <LanguageView />;
        case 'SOUND': return <SoundView />;
        default: return null;
    }
  };

  if (currentView === 'MENU') {
    return (
        <div className="flex flex-col h-full bg-background animate-fade-in pb-12 relative overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#1F2833] to-transparent z-0"></div>
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-neon/10 rounded-full blur-3xl z-0"></div>
            
            <div className="relative z-10 p-6">
                <div className="flex justify-between items-start mb-6">
                     <h1 className="font-title text-2xl text-white tracking-wider">MY <span className="text-neon">PROFILE</span></h1>
                     <div className="flex gap-2">
                        <button onClick={() => setCurrentView('EDIT_PROFILE')} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white transition-colors">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={onLogout} className="p-2 bg-danger/10 border border-danger/30 rounded-lg hover:bg-danger/20 text-danger transition-colors">
                            <Shield size={18} />
                        </button>
                     </div>
                </div>

                <div className="bg-gradient-to-br from-panel/90 to-black/90 backdrop-blur-md border border-gray-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-8">
                     <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                     
                     <div className="flex flex-col items-center relative z-10">
                        <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-neonDim to-neon shadow-[0_0_20px_rgba(102,252,241,0.5)] mb-4">
                             <img src={user.avatarUrl} alt="User" className="w-full h-full rounded-full bg-black object-cover" />
                        </div>
                        <h2 className="text-2xl font-title text-white mb-1">{user.name}</h2>
                        
                        <div className="flex flex-col items-center gap-1 mb-6">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold/20 text-gold border border-gold/30">{user.role === 'ADMIN' ? 'ADMIN' : 'VIP PLAYER'}</span>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-textMuted text-xs flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                                {user.phone && (
                                    <span className="text-textMuted text-xs flex items-center gap-1 border-l border-gray-600 pl-3"><Phone size={10} /> {user.phone}</span>
                                )}
                            </div>
                        </div>

                        {user.role === 'ADMIN' && (
                             <button 
                                onClick={() => setScreen(Screen.ADMIN)}
                                className="w-full mb-4 bg-neon/10 border border-neon text-neon font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-neon hover:text-black transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]"
                             >
                                <LayoutDashboard size={18} /> OPEN ADMIN DASHBOARD
                             </button>
                        )}

                        <div className="grid grid-cols-3 gap-2 w-full">
                            <div className="bg-black/40 rounded-xl p-3 flex flex-col items-center border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Games</span>
                                <span className="font-digital text-xl text-white">{user.stats.gamesPlayed}</span>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 flex flex-col items-center border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Win Rate</span>
                                <span className="font-digital text-xl text-neon">{winRate}%</span>
                            </div>
                            <div className="bg-black/40 rounded-xl p-3 flex flex-col items-center border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Won</span>
                                <span className="font-digital text-xl text-gold">{(user.stats.totalWon / 1000).toFixed(1)}k</span>
                            </div>
                        </div>
                     </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button onClick={() => setScreen(Screen.WALLET)} className="bg-panel border border-gray-800 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <Download size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-300">Deposit</span>
                    </button>
                    <button onClick={() => setScreen(Screen.WALLET)} className="bg-panel border border-gray-800 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/5 transition-colors group">
                         <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                            <Upload size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-300">Withdraw</span>
                    </button>
                </div>

                <h3 className="text-textMuted text-xs font-bold uppercase tracking-widest mb-4 ml-2">{t('Account Settings')}</h3>
                <div className="bg-panel border border-gray-800 rounded-2xl overflow-hidden mb-8">
                    <button onClick={() => setScreen(Screen.HISTORY)} className="w-full flex items-center justify-between p-4 border-b border-gray-800 hover:bg-white/5">
                         <div className="flex items-center gap-3">
                            <Activity size={18} className="text-blue-400" />
                            <span className="text-sm font-bold text-white">Game History</span>
                         </div>
                         <ChevronRight size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => setCurrentView('CHANGE_PASSWORD')} className="w-full flex items-center justify-between p-4 border-b border-gray-800 hover:bg-white/5">
                         <div className="flex items-center gap-3">
                            <Lock size={18} className="text-orange-400" />
                            <span className="text-sm font-bold text-white">Security & Password</span>
                         </div>
                         <ChevronRight size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => setCurrentView('SOUND')} className="w-full flex items-center justify-between p-4 border-b border-gray-800 hover:bg-white/5">
                         <div className="flex items-center gap-3">
                            <Volume2 size={18} className="text-green-400" />
                            <span className="text-sm font-bold text-white">Sound Settings</span>
                         </div>
                         <ChevronRight size={16} className="text-gray-600" />
                    </button>
                    <button onClick={() => setCurrentView('LANGUAGE')} className="w-full flex items-center justify-between p-4 hover:bg-white/5">
                         <div className="flex items-center gap-3">
                            <Globe size={18} className="text-purple-400" />
                            <span className="text-sm font-bold text-white">Language / Langue</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-500">{language}</span>
                             <ChevronRight size={16} className="text-gray-600" />
                         </div>
                    </button>
                </div>
                
                 <button 
                    onClick={onLogout}
                    className="w-full py-4 text-danger font-bold text-sm tracking-widest hover:bg-danger/5 rounded-xl transition-colors mb-8"
                >
                    LOGOUT
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background animate-fade-in pb-12">
        <div className="p-4 bg-gradient-to-b from-panel to-background border-b border-gray-800 flex items-center sticky top-0 z-20 shadow-md">
            <button onClick={() => setCurrentView('MENU')} className="mr-4 text-textMuted hover:text-white">
                <ChevronLeft size={24} />
            </button>
            <h1 className="font-title text-lg text-white flex-1 text-center pr-10 uppercase tracking-wider">
                {t(currentView.replace('_', ' '))}
            </h1>
        </div>
        <div className="p-6 h-full flex-1">
            {renderContent()}
        </div>
    </div>
  );
};

export default ProfileScreen;
