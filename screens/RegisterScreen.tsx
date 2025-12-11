
import React, { useState } from 'react';
import { Screen, User } from '../types';
import NeonButton from '../components/NeonButton';
import { ArrowLeft, User as UserIcon, Mail, Phone, Lock, Dices } from 'lucide-react';

interface RegisterScreenProps {
  setScreen: (screen: Screen) => void;
  onRegister: (user: User) => boolean;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ setScreen, onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const isValid = 
    formData.name.trim().length > 0 && 
    formData.email.trim().length > 0 && 
    formData.phone.trim().length > 0 && 
    formData.password.trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = () => {
      const newUser: User = {
          id: Date.now().toString(), // Generate unique ID
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          balance: 0,
          avatarUrl: '', // Will be generated in App.tsx
          role: 'USER'
      };
      onRegister(newUser);
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
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-textMuted uppercase ml-1">Full Name</label>
                        <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon transition-colors" size={18} />
                            <input 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text" 
                                className="w-full bg-panel border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:border-neon focus:shadow-[0_0_10px_rgba(102,252,241,0.2)] focus:outline-none transition-all placeholder:text-gray-600" 
                                placeholder="John Doe" 
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
                        <NeonButton fullWidth onClick={handleRegister} disabled={!isValid}>
                            REGISTER NOW
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
