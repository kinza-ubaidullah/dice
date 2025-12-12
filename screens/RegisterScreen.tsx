
import React, { useState } from 'react';
import { Screen, User } from '../types';
import NeonButton from '../components/NeonButton';
import { ArrowLeft, User as UserIcon, Mail, Phone, Lock } from 'lucide-react';

interface RegisterScreenProps {
  setScreen: (screen: Screen) => void;
  onRegister: (user: User) => Promise<boolean>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ setScreen, onRegister }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const isValid = 
    formData.firstName.trim().length > 0 && 
    formData.lastName.trim().length > 0 &&
    formData.email.trim().length > 0 && 
    formData.phone.trim().length > 0 && 
    formData.password.trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
      setIsLoading(true);
      
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const newUser: User = {
          id: Date.now().toString(), // Temporary ID, API usually returns real UID
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          wallet: {
              balance: 0,
              totalDeposited: 0,
              totalWithdrawn: 0
          },
          avatarUrl: '', 
          role: 'USER',
          stats: {
              gamesPlayed: 0,
              gamesWon: 0,
              totalWagered: 0,
              totalWon: 0
          },
          withdrawalLimits: {
              countThisWeek: 0,
              lastWithdrawalDate: new Date().toISOString()
          }
      };
      
      try {
          const { authApi } = await import('../utils/api');
          // Make API call
          const response = await authApi.signup(
              formData.email, 
              formData.password, 
              formData.firstName, 
              formData.lastName, 
              formData.phone
          );
          
          if (response) {
             const apiUser = {
                 ...newUser,
                 // Use API returned data if available
                 id: response.uid || response.id || newUser.id,
                 name: response.displayName || `${response.firstName} ${response.lastName}` || newUser.name,
                 role: 'USER'
             };
             // Pass to parent handler to set state/login
             await onRegister(apiUser);
          }
      } catch (error: any) {
          alert(`Registration Failed: ${error.message || 'Unknown error'}`);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0C10] animate-fade-in overflow-hidden">
      
       {/* LEFT SIDE - Desktop Visuals */}
       <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden border-r border-gray-800">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2942&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0C10]/50 to-[#0B0C10]"></div>
          
          <div className="relative z-10 text-center px-12">
              <h2 className="font-title text-4xl text-white mb-6 leading-tight">
                  JOIN THE <br/> <span className="text-gold">ELITE CLUB</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-md mx-auto">
                  Experience the ultimate high-stakes dice game. Compete, win, and withdraw instantly.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-12 max-w-sm mx-auto">
                  <div className="bg-panel/80 p-4 rounded-xl border border-gray-700 backdrop-blur-sm">
                      <p className="text-neon font-digital text-3xl font-bold">10K+</p>
                      <p className="text-[10px] uppercase text-textMuted tracking-wider">Active Players</p>
                  </div>
                  <div className="bg-panel/80 p-4 rounded-xl border border-gray-700 backdrop-blur-sm">
                      <p className="text-gold font-digital text-3xl font-bold">24/7</p>
                      <p className="text-[10px] uppercase text-textMuted tracking-wider">Instant Withdraw</p>
                  </div>
              </div>
          </div>
       </div>

      {/* RIGHT SIDE - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        
        <div className="p-6 md:p-8">
            <button onClick={() => setScreen(Screen.LOGIN)} className="flex items-center text-textMuted hover:text-white transition-colors group">
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Login
            </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pb-8">
            <div className="max-w-md mx-auto w-full">
                <h2 className="font-title text-3xl text-white mb-2">Create Account</h2>
                <p className="text-textMuted text-sm mb-8">Join the table and start rolling.</p>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-bold text-textMuted uppercase ml-1">First Name</label>
                            <input 
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                type="text" 
                                className="w-full bg-panel border border-gray-700 rounded-xl py-3 px-4 text-white focus:border-neon focus:outline-none placeholder:text-gray-600" 
                                placeholder="John" 
                            />
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-xs font-bold text-textMuted uppercase ml-1">Last Name</label>
                            <input 
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                type="text" 
                                className="w-full bg-panel border border-gray-700 rounded-xl py-3 px-4 text-white focus:border-neon focus:outline-none placeholder:text-gray-600" 
                                placeholder="Doe" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-textMuted uppercase ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon transition-colors" size={18} />
                            <input 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email" 
                                className="w-full bg-panel border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:border-neon focus:shadow-[0_0_10px_rgba(102,252,241,0.2)] focus:outline-none transition-all placeholder:text-gray-600" 
                                placeholder="john@example.com" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-textMuted uppercase ml-1">Phone</label>
                        <div className="relative group">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon transition-colors" size={18} />
                            <input 
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="tel" 
                                className="w-full bg-panel border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:border-neon focus:shadow-[0_0_10px_rgba(102,252,241,0.2)] focus:outline-none transition-all placeholder:text-gray-600" 
                                placeholder="+229 00 00 00 00" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-textMuted uppercase ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon transition-colors" size={18} />
                            <input 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                type="password" 
                                className="w-full bg-panel border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:border-neon focus:shadow-[0_0_10px_rgba(102,252,241,0.2)] focus:outline-none transition-all placeholder:text-gray-600" 
                                placeholder="Create a strong password" 
                            />
                        </div>
                    </div>
                    
                    <div className="pt-6">
                        <NeonButton fullWidth onClick={handleRegister} disabled={!isValid || isLoading}>
                            {isLoading ? 'REGISTERING...' : 'REGISTER NOW'}
                        </NeonButton>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
