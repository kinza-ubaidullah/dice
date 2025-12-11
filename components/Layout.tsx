
import React, { ReactNode } from 'react';
import { Screen } from '../types';
import { Home, Gamepad2, Wallet, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  isAdmin?: boolean;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentScreen, 
  setScreen, 
  isAdmin = false,
  onLogout
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
    { id: Screen.HOME, label: 'Lobby', icon: <Home size={20} /> },
    { id: Screen.GAME, label: 'Games', icon: <Gamepad2 size={20} /> },
    { id: Screen.WALLET, label: 'Wallet', icon: <Wallet size={20} /> },
    { id: Screen.PROFILE, label: 'Profile', icon: <UserIcon size={20} /> },
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

            {/* Admin Return Link */}
            {isAdmin && (
               <button
                  onClick={() => setScreen(Screen.ADMIN)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 text-gold hover:bg-gold/10 hover:text-white mt-6 border border-gold/20"
              >
                  <LayoutDashboard size={20} />
                  <span className="font-bold tracking-wide">Admin Panel</span>
              </button>
            )}
        </nav>

        <div className="p-4 border-t border-gray-800">
             <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-all"
            >
                <LogOut size={20} /> Logout
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
            
            {/* Admin Mobile Link */}
            {isAdmin && (
                <button
                    onClick={() => setScreen(Screen.ADMIN)}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gold"
                >
                    <div className="p-1.5 rounded-full bg-gold/10">
                        <LayoutDashboard size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
                </button>
            )}
        </div>
      </nav>

    </div>
  );
};

export default Layout;
