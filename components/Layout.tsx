
import React, { ReactNode } from 'react';
import { Screen } from '../types';
import { Home, Gamepad2, Wallet, User as UserIcon, LogOut, Wifi, WifiOff } from 'lucide-react';
import { translate } from '../utils/i18n';

interface LayoutProps {
  children: ReactNode;
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  language?: string;
  isOnline?: boolean;
  setIsOnline?: (status: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentScreen, 
  setScreen, 
  isAdmin = false,
  onLogout,
  language = 'English',
  isOnline = true,
  setIsOnline
}) => {
  // If we are in Auth screens, use a simple full-screen container
  if (currentScreen === Screen.LOGIN || currentScreen === Screen.REGISTER) {
    return (
      <div className="min-h-screen w-full bg-[#0B0C10] text-white">
        {children}
      </div>
    );
  }

  const navItems = [
    { id: Screen.HOME, label: translate('Lobby', language), icon: <Home size={20} /> },
    { id: Screen.GAME, label: translate('Games', language), icon: <Gamepad2 size={20} /> },
    { id: Screen.WALLET, label: translate('Wallet', language), icon: <Wallet size={20} /> },
    { id: Screen.PROFILE, label: translate('Profile', language), icon: <UserIcon size={20} /> },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0B0C10] text-white flex flex-col md:flex-row overflow-hidden font-body">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-panel border-r border-gray-800 shrink-0 h-screen">
        <div className="p-6">
           <h1 className="font-title text-2xl tracking-wider">LARGE <span className="text-neon">NUMBER</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setScreen(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 ${
                        currentScreen === item.id 
                        ? 'bg-gradient-to-r from-neonDim/20 to-transparent text-neon border-l-4 border-neon' 
                        : 'text-textMuted hover:bg-white/5 hover:text-white'
                    }`}
                >
                    {item.icon}
                    <span className="font-bold tracking-wide">{item.label}</span>
                </button>
            ))}

            {/* Online/Offline Toggle */}
            {setIsOnline && (
                <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 mt-8 ${
                        isOnline 
                        ? 'text-green-400 bg-green-400/10 border border-green-500/30' 
                        : 'text-gray-500 bg-gray-700/20 border border-gray-700'
                    }`}
                >
                    {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                    <div className="text-left">
                        <span className="font-bold tracking-wide block text-sm">{isOnline ? 'ONLINE MODE' : 'OFFLINE MODE'}</span>
                        <span className="text-[10px] opacity-70 block">{isOnline ? 'Multiplayer & API' : 'Demo Simulation'}</span>
                    </div>
                </button>
            )}
        </nav>

        <div className="p-4 border-t border-gray-800">
             <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-all"
            >
                <LogOut size={20} /> {translate('Logout', language)}
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative scroll-smooth pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto h-full min-h-full flex flex-col">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-panel/95 backdrop-blur-md border-t border-gray-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setScreen(item.id)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                        currentScreen === item.id ? 'text-neon' : 'text-gray-500'
                    }`}
                >
                    <div className={`p-1.5 rounded-full transition-all ${currentScreen === item.id ? 'bg-neon/10 -translate-y-1' : ''}`}>
                        {item.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </button>
            ))}
             {/* Mobile Wifi Toggle (Mini) */}
             {setIsOnline && (
                <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isOnline ? 'text-green-400' : 'text-gray-600'}`}
                >
                    <div className={`p-1.5 rounded-full transition-all ${isOnline ? 'bg-green-500/10' : ''}`}>
                         {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                    </div>
                     <span className="text-[10px] font-bold uppercase tracking-wider">{isOnline ? 'ON' : 'OFF'}</span>
                </button>
             )}
        </div>
      </nav>

    </div>
  );
};

export default Layout;
