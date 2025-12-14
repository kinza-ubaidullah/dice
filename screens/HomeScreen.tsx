
import React from 'react';
import { User, Screen } from '../types';
import { Play, Wallet, Trophy, Flame, Star, Dices as DiceIcon, Plus } from 'lucide-react';
import Dice from '../components/Dice';
import { translate } from '../utils/i18n';

interface HomeScreenProps {
  user: User;
  setScreen: (screen: Screen) => void;
  language?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
    user, setScreen, language = 'English' 
}) => {
  const t = (key: string) => translate(key, language);

  return (
    <div className="flex flex-col min-h-full p-4 md:p-8 animate-fade-in gap-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      
      {/* Header Profile & Balance */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-gradient-to-r from-panel to-[#151a21] p-4 md:p-6 rounded-2xl border border-gray-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-neonDim to-neon p-[2px] shadow-neon">
            <img 
              src={user.avatarUrl} 
              alt="Profile" 
              className="w-full h-full rounded-full bg-black object-cover" 
            />
          </div>
          <div>
            <h1 className="text-white font-title text-lg md:text-2xl tracking-wider uppercase">{user.name}</h1>
            <div className="flex items-center gap-2 text-gold">
                <Trophy size={14} />
                <span className="text-xs md:text-sm font-bold">{t('Pro Member')}</span>
            </div>
          </div>
        </div>

        <div 
            onClick={() => setScreen(Screen.WALLET)}
            className="group cursor-pointer flex items-center justify-between md:justify-end gap-4 bg-black/30 p-4 rounded-xl border border-white/5 md:min-w-[300px] transition-all hover:border-neon/50 hover:bg-black/50"
        >
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-orange-500/20 rounded-xl text-orange-400 relative">
                <Wallet size={24} />
                {user.wallet.balance <= 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#151a21] animate-pulse"></div>
                )}
            </div>
            <div className="text-right flex-1">
                <p className="text-textMuted text-xs font-bold uppercase tracking-widest flex justify-end gap-1 items-center">
                    {t('Wallet Balance')} 
                    {user.wallet.balance <= 0 && <span className="text-[9px] text-neon bg-neon/10 px-1 rounded animate-pulse">{t('Top Up')}</span>}
                </p>
                <p className="text-neon font-digital text-2xl md:text-3xl font-bold tracking-wider group-hover:text-white transition-colors">
                    {user.wallet.balance.toLocaleString()} CFA
                </p>
            </div>
            <div className="bg-neon/10 p-1.5 rounded-full text-neon opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={16} />
            </div>
        </div>
      </div>

      {/* Trending Games */}
      <div>
        <h2 className="font-title text-white text-lg mb-4 flex items-center gap-2">
            <Flame className="text-red-500" /> {t('Trending Games')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Casino Dice (Existing Game) */}
            <div onClick={() => setScreen(Screen.GAME)} className="group bg-gradient-to-b from-[#1F2833] to-[#0B0C10] p-4 rounded-2xl border border-gray-800 hover:border-gold transition-all cursor-pointer relative overflow-hidden h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-gold/5 group-hover:bg-gold/10 transition-colors"></div>
                <div className="scale-75 group-hover:scale-90 transition-transform duration-300">
                    <Dice value={6} isRolling={false} color="gold" size="lg" />
                </div>
                <div className="absolute bottom-3 left-0 w-full text-center">
                    <span className="text-gold font-bold text-xs uppercase tracking-wider">Casino Dice</span>
                </div>
            </div>

            {/* Dice Table (New Game) */}
            <div onClick={() => setScreen(Screen.DICE_TABLE)} className="group bg-gradient-to-b from-[#1F2833] to-[#0B0C10] p-4 rounded-2xl border border-gray-800 hover:border-danger transition-all cursor-pointer relative overflow-hidden h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-danger/5 group-hover:bg-danger/10 transition-colors"></div>
                <div className="scale-75 group-hover:scale-90 transition-transform duration-300 rotate-12">
                    <Dice value={5} isRolling={false} color="danger" size="lg" />
                </div>
                <div className="absolute bottom-3 left-0 w-full text-center">
                    <span className="text-danger font-bold text-xs uppercase tracking-wider">Dice Table</span>
                </div>
            </div>
        </div>
      </div>

      {/* Featured Game */}
      <div>
        <h2 className="font-title text-white text-lg mb-4 flex items-center gap-2">
            <Star className="text-neon" /> {t('Featured Games')}
        </h2>
        <div className="relative rounded-3xl overflow-hidden border border-neon/30 group cursor-pointer" onClick={() => setScreen(Screen.GAME)}>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10"></div>
            <div className="bg-[#1a222e] h-48 md:h-64 flex items-center justify-between px-6 md:px-12 relative">
                {/* Background Pattern */}
                <div className="absolute right-[-50px] top-[-50px] opacity-20 rotate-45">
                    <DiceIcon size={300} className="text-neonDim" />
                </div>

                <div className="relative z-20 space-y-4">
                    <h3 className="font-title text-3xl md:text-5xl text-white italic">CASINO DICE</h3>
                    <p className="text-textMuted max-w-[200px] text-sm md:text-base">{t('Experience Thrill')}</p>
                    <button className="bg-neon text-black font-bold py-2 px-6 rounded-lg hover:shadow-[0_0_20px_#66FCF1] transition-shadow">
                        {t('Play Now')}
                    </button>
                </div>
                
                <div className="relative z-20 hidden md:block group-hover:rotate-180 transition-transform duration-700">
                     <div className="flex gap-4">
                        <Dice value={3} isRolling={false} color="neon" size="lg" />
                        <Dice value={4} isRolling={false} color="neon" size="lg" />
                     </div>
                </div>
            </div>
        </div>
      </div>

      {/* All Games Grid */}
      <div>
        <h2 className="font-title text-white text-lg mb-4">{t('All Games')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
             {[1,2,3,4].map((i) => (
                <div key={i} onClick={() => setScreen(Screen.GAME)} className="bg-panel border border-gray-800 rounded-xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-full aspect-square bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <Dice value={i} isRolling={false} color="neon" size="md" />
                    </div>
                    <span className="text-sm font-bold text-gray-300">Dice Rolling</span>
                </div>
             ))}
        </div>
      </div>

      {/* Spacing for bottom nav on mobile */}
      <div className="h-12 md:h-0"></div>
    </div>
  );
};

export default HomeScreen;
