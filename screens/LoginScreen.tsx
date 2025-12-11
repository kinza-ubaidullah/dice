
import React, { useState } from 'react';
import { Screen, User } from '../types';
import NeonButton from '../components/NeonButton';
import { Lock, User as UserIcon, Dices, AlertCircle, X, ChevronRight, ServerOff } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => boolean;
  setScreen: (screen: Screen) => void;
  registeredUsers: User[];
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, setScreen, registeredUsers }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForgotPass, setShowForgotPass] = useState(false);

  const isValid = identifier.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (!isValid) return;
    setError(null);

    const success = onLogin(identifier, password);
    if (!success) {
      setError("Invalid username/email or password.");
    }
  };

  const handleQuickLogin = (u: User) => {
    setIdentifier(u.name); // Prefer username for quick login
    const passInput = document.getElementById('login-password');
    if (passInput) passInput.focus();
  };

  const ForgotPasswordModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-panel border border-gray-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
              <button 
                onClick={() => setShowForgotPass(false)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                  <X size={20} />
              </button>
              
              <h3 className="font-title text-2xl text-white mb-2">Reset Password</h3>
              <p className="text-sm text-textMuted mb-6">Enter your email address and we'll send you a link to reset your password.</p>
              
              <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-textMuted uppercase ml-1">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full bg-[#0B0C10] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-neon outline-none"
                      />
                  </div>
                  <NeonButton fullWidth onClick={() => { alert("Reset link sent to your email!"); setShowForgotPass(false); }}>
                      SEND RESET LINK
                  </NeonButton>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0B0C10] animate-fade-in overflow-hidden relative">
       {showForgotPass && <ForgotPasswordModal />}

       {/* LEFT SIDE - Desktop Visuals */}
       <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden border-r border-gray-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-[#0B0C10]"></div>
          
          <div className="relative z-10 text-center p-12">
              <div className="w-32 h-32 mx-auto bg-neon/10 rounded-full flex items-center justify-center border border-neon mb-8 shadow-[0_0_50px_rgba(102,252,241,0.3)] animate-pulse-fast">
                <Dices size={64} className="text-neon" />
              </div>
              <h1 className="font-title text-6xl text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                DICE <span className="text-neon">WORD</span>
              </h1>
              <p className="text-gold text-xl tracking-widest uppercase font-digital">
                by Big Size Entertainment
              </p>
          </div>
       </div>

       {/* RIGHT SIDE - Form */}
       <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
             <h1 className="font-title text-5xl text-white">
               DICE <br /> <span className="text-neon">WORD</span>
             </h1>
          </div>

          <div className="max-w-md mx-auto w-full z-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-textMuted mb-8">Enter your credentials to access your wallet.</p>

            {/* Quick Access */}
            {registeredUsers.length > 0 && (
                <div className="mb-8">
                    <p className="text-xs font-bold text-textMuted uppercase mb-3 ml-1">Quick Access (Local Only)</p>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {registeredUsers.map(u => (
                            <button 
                                key={u.id}
                                onClick={() => handleQuickLogin(u)}
                                className="flex flex-col items-center gap-2 min-w-[70px] group flex-shrink-0"
                            >
                                <div className={`w-14 h-14 rounded-full p-[2px] transition-all ${identifier === u.name ? 'bg-neon shadow-[0_0_15px_rgba(102,252,241,0.5)]' : 'bg-gray-700 group-hover:bg-gray-500'}`}>
                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full bg-black object-cover" />
                                </div>
                                <span className={`text-[10px] font-bold truncate w-full text-center ${identifier === u.name ? 'text-neon' : 'text-gray-500 group-hover:text-white'}`}>
                                    {u.name.split(' ')[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-danger/10 border border-danger/50 rounded-xl flex items-center gap-3 text-danger animate-fade-in">
                <AlertCircle size={20} />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-textMuted uppercase ml-1">Username / Email / Phone</label>
                  <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon transition-colors" size={20} />
                      <input 
                          type="text" 
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Enter your ID"
                          className="w-full bg-panel border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-neon focus:shadow-[0_0_15px_rgba(102,252,241,0.2)] focus:outline-none transition-all placeholder:text-gray-600"
                      />
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold text-textMuted uppercase ml-1">Password</label>
                  <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon transition-colors" size={20} />
                      <input 
                          id="login-password"
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-panel border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white focus:border-neon focus:shadow-[0_0_15px_rgba(102,252,241,0.2)] focus:outline-none transition-all placeholder:text-gray-600"
                      />
                  </div>
              </div>

              <div className="pt-4">
                  <NeonButton fullWidth onClick={handleLogin} disabled={!isValid}>
                      LOGIN
                  </NeonButton>
              </div>

              <div className="flex justify-between items-center text-xs mt-4">
                  <button onClick={() => setScreen(Screen.REGISTER)} className="text-white hover:text-neon underline underline-offset-4 transition-colors">
                      Create Account
                  </button>
                  <button onClick={() => setShowForgotPass(true)} className="text-gray-500 hover:text-white transition-colors">Forgot Password?</button>
              </div>
            </div>

            {/* Offline/Local Disclaimer */}
            <div className="mt-8 mb-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                <ServerOff size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                    <strong className="text-yellow-500">Local Demo Mode:</strong> Accounts are saved to your browser's local storage. They will not sync across different devices or browsers. To access your account, please use the same device you registered on.
                </p>
            </div>

            <div className="mt-4 text-center border-t border-gray-800 pt-6">
                <p className="text-[10px] text-gray-600">
                    By logging in, you agree to our Terms of Service.
                    <br/> (Hint: Type 'admin' / 'admin' for Admin Panel)
                </p>
            </div>
          </div>
       </div>
    </div>
  );
};

export default LoginScreen;
