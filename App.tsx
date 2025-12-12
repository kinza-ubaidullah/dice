
import React, { useState, useEffect } from 'react';
import { Screen, User, GameRecord, Transaction } from './types';
import Layout from './components/Layout';
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import WalletScreen from './screens/WalletScreen';
import HistoryScreen from './screens/HistoryScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminDashboard from './screens/AdminDashboard';
import ProfileScreen from './screens/ProfileScreen';
import DiceTableScreen from './screens/DiceTableScreen';
import { Dices, Loader2 } from 'lucide-react';
import { authApi } from './utils/api';
import { useSocket } from './hooks/useSocket'; // Import Socket Hook

// Default Data Cleared for Production/API-First Approach
const DEFAULT_USERS: User[] = [];

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true); // App Loader State
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [returnScreen, setReturnScreen] = useState<Screen>(Screen.HOME); // Track where to return after Wallet
  const [betAmount, setBetAmount] = useState<number>(500); // Default to 500 Minimum
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // NETWORK STATE
  // Defaults to navigator.onLine, but can be manually toggled
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Socket Integration (Mocked to prevent errors)
  const { trackLiveUsers } = useSocket();

  // Global Settings (Shared between Admin and Game)
  const [commissionRate, setCommissionRate] = useState<number>(5); // Default 5%
  
  // Language State with Persistence
  const [language, setLanguage] = useState<string>(() => {
      return localStorage.getItem('app_language') || 'English';
  });

  // Local state for registered users (Persistent Database)
  // UPDATED KEY to 'app_users_v3' to clear old cached admins
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
      try {
          const saved = localStorage.getItem('app_users_v3');
          if (saved) {
              return JSON.parse(saved);
          }
          return DEFAULT_USERS;
      } catch {
          return DEFAULT_USERS;
      }
  });

  // Current Logged In User
  const [currentUser, setCurrentUser] = useState<User>({
      id: '',
      name: '',
      email: '',
      wallet: { balance: 0, totalDeposited: 0, totalWithdrawn: 0 },
      avatarUrl: '',
      role: 'USER',
      stats: { gamesPlayed: 0, gamesWon: 0, totalWagered: 0, totalWon: 0 },
      withdrawalLimits: { countThisWeek: 0, lastWithdrawalDate: new Date().toISOString() }
  });

  const [history, setHistory] = useState<GameRecord[]>([]);
  
  // Transaction History State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
        const savedTx = localStorage.getItem('app_transactions');
        return savedTx ? JSON.parse(savedTx) : [];
    } catch {
        return [];
    }
  });

  // --- EFFECTS ---

  // 1. Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. Network Listener
  useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // 3. Persist Transactions
  useEffect(() => {
      localStorage.setItem('app_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // 4. Persist Language
  useEffect(() => {
      localStorage.setItem('app_language', language);
  }, [language]);

  // 5. Persist Users (The Database)
  useEffect(() => {
      localStorage.setItem('app_users_v3', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // 6. Sync Active User State to Database (Critical for Wallet Persistence)
  useEffect(() => {
      if (isAuthenticated && currentUser && currentUser.id) {
          setRegisteredUsers(prevUsers => {
              const index = prevUsers.findIndex(u => u.id === currentUser.id);
              // Only update if the user exists and data has changed
              if (index > -1) {
                  const dbUser = prevUsers[index];
                  // Simple equality check to avoid infinite loops
                  if (JSON.stringify(dbUser) !== JSON.stringify(currentUser)) {
                      const newUsers = [...prevUsers];
                      newUsers[index] = currentUser;
                      return newUsers;
                  }
              }
              return prevUsers;
          });
      }
  }, [currentUser, isAuthenticated]);
  
  // 7. Presence Tracking (Mocked)
  useEffect(() => {
      if (isAuthenticated && currentUser.id && isOnline) {
          trackLiveUsers(currentUser.id, currentUser.name);
          
          const interval = setInterval(() => {
              trackLiveUsers(currentUser.id, currentUser.name);
          }, 30000);
          
          return () => clearInterval(interval);
      }
  }, [isAuthenticated, currentUser.id, currentUser.name, trackLiveUsers, isOnline]);


  const addHistory = (record: GameRecord) => {
    setHistory(prev => [...prev, record]);
  };

  const addTransaction = (tx: Transaction) => {
      setTransactions(prev => [tx, ...prev]);
  };

  /**
   * Wrapper for screen navigation to handle history
   */
  const handleSetScreen = (screen: Screen) => {
      // If we are navigating TO the wallet, remember where we came from
      if (screen === Screen.WALLET) {
          setReturnScreen(currentScreen);
      }
      setCurrentScreen(screen);
  };

  /**
   * Helper to Map API User Response to Frontend User Type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapApiUserToState = (apiData: any): User => {
      return {
          id: apiData.uid || apiData.id || Date.now().toString(),
          name: apiData.displayName || apiData.name || 'Unknown User',
          email: apiData.email || '',
          phone: apiData.phone || apiData.phoneNumber || '',
          password: apiData.password, // Keep password for local auth check if needed later
          role: apiData.role ? (apiData.role.toUpperCase() as 'USER' | 'ADMIN') : 'USER',
          avatarUrl: apiData.photoURL || `https://ui-avatars.com/api/?name=${apiData.displayName || 'User'}&background=random`,
          wallet: apiData.wallet || {
              balance: apiData.balance || 0, 
              totalDeposited: 0,
              totalWithdrawn: 0
          },
          stats: apiData.stats || {
              gamesPlayed: 0,
              gamesWon: 0,
              totalWagered: 0,
              totalWon: 0
          },
          withdrawalLimits: apiData.withdrawalLimits || {
              countThisWeek: 0,
              lastWithdrawalDate: new Date().toISOString()
          },
          isBlocked: apiData.isBlocked || false
      };
  };

  // Handle Registration Success
  const handleRegisterSuccess = async (partialUser: Partial<User>) => {
    const newUser = mapApiUserToState(partialUser);
    
    // Save to local database for cache
    setRegisteredUsers(prev => [...prev, newUser]);
    
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsAdmin(newUser.role === 'ADMIN');
    handleSetScreen(newUser.role === 'ADMIN' ? Screen.ADMIN : Screen.HOME);
    
    return true;
  };

  // Handle Login
  const handleLogin = async (identifier: string, pass: string): Promise<boolean> => {
    try {
        // 1. API Login First (Priority if Online)
        if (isOnline) {
            try {
                // authApi.login expects phone number usually, but we pass identifier
                const response = await authApi.login(identifier, pass);
                const userData = response.data || response;
                
                if (userData) {
                    const mappedUser = mapApiUserToState(userData);

                    if (mappedUser.isBlocked) {
                        throw new Error("Account is blocked. Contact support.");
                    }

                    // Update local cache
                    setRegisteredUsers(prev => {
                        const exists = prev.findIndex(u => u.id === mappedUser.id);
                        if (exists > -1) {
                            const newArr = [...prev];
                            newArr[exists] = mappedUser; // Update existing
                            return newArr;
                        }
                        return [...prev, mappedUser]; // Add new
                    });

                    setCurrentUser(mappedUser);
                    setIsAuthenticated(true);
                    setIsAdmin(mappedUser.role === 'ADMIN');
                    handleSetScreen(mappedUser.role === 'ADMIN' ? Screen.ADMIN : Screen.HOME);
                    return true;
                }
            } catch (e: any) {
                 console.warn("API Login failed:", e.message);
                 // If API explicitly fails (401/403), do not fallback to local unless network error
                 if (e.message.includes('Invalid') || e.message.includes('password')) {
                     throw e;
                 }
            }
        }

        // 2. Fallback to Local Storage (Only if Offline or API failed due to connection)
        const localUser = registeredUsers.find(u => 
            (u.name === identifier || u.email === identifier || u.phone === identifier) &&
            (u.password === pass)
        );

        if (localUser) {
            if (localUser.isBlocked) throw new Error("Account is blocked.");
            
            console.log("Logged in via Local Storage (Offline Mode)");
            setCurrentUser(localUser);
            setIsAuthenticated(true);
            setIsAdmin(localUser.role === 'ADMIN');
            handleSetScreen(localUser.role === 'ADMIN' ? Screen.ADMIN : Screen.HOME);
            return true;
        }
        
        throw new Error("Invalid credentials.");

    } catch (error: any) {
        console.error("Login Error:", error);
        throw error;
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setIsAdmin(false);
      handleSetScreen(Screen.LOGIN);
  };

  // Global User Management Handlers (Admin)
  const handleUpdateUser = (updatedUser: User) => {
    // Update local persistence
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    // If Admin edited the currently logged-in user (self), update session state
    if (currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
      setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
      if (currentUser.id === userId) {
          handleLogout();
      }
  };

  // --- RENDER LOGIC ---

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0C10] flex flex-col items-center justify-center overflow-hidden">
         {/* Background Image */}
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-[#0B0C10]"></div>

         <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
            <div className="w-24 h-24 mb-6 bg-neon/10 rounded-full flex items-center justify-center border border-neon shadow-[0_0_50px_rgba(102,252,241,0.4)] animate-pulse-fast">
              <Dices size={48} className="text-neon" />
            </div>
            <h1 className="font-title text-4xl md:text-6xl text-white mb-2 tracking-tight">
              DICE <span className="text-neon">WORD</span>
            </h1>
            <p className="text-gold font-digital text-lg md:text-xl tracking-widest uppercase mb-8">
              by Big Size Entertainment
            </p>
            <div className="flex items-center gap-3 text-textMuted text-sm">
               <Loader2 className="animate-spin text-neon" size={18} />
               <span>Loading Experience...</span>
            </div>
         </div>
      </div>
    );
  }

  const renderScreen = () => {
    // Unauthenticated Routes
    if (!isAuthenticated) {
        if (currentScreen === Screen.REGISTER) {
            return <RegisterScreen setScreen={handleSetScreen} onRegister={handleRegisterSuccess} />;
        }
        return <LoginScreen onLogin={handleLogin} setScreen={handleSetScreen} language={language}/>;
    }

    // Admin Dashboard Screen (Isolated from Layout)
    if (currentScreen === Screen.ADMIN) {
        return (
            <AdminDashboard 
                onLogout={handleLogout} 
                commissionRate={commissionRate}
                setCommissionRate={setCommissionRate}
                onEnterGame={() => handleSetScreen(Screen.HOME)}
                users={registeredUsers} 
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                masterTransactions={transactions}
                addTransaction={addTransaction}
            />
        );
    }

    // Authenticated User Routes (Wrapped in Layout)
    switch (currentScreen) {
      case Screen.HOME:
        return (
          <HomeScreen 
            user={currentUser} 
            setScreen={handleSetScreen} 
          />
        );
      case Screen.GAME:
        return (
          <GameScreen 
            user={currentUser} 
            setUser={setCurrentUser} 
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            playerCount={playerCount}
            setPlayerCount={setPlayerCount}
            addHistory={addHistory} 
            setScreen={handleSetScreen}
            commissionRate={commissionRate}
            isOnline={isOnline}
          />
        );
      case Screen.DICE_TABLE:
          return (
             <DiceTableScreen 
                user={currentUser}
                setUser={setCurrentUser}
                setScreen={handleSetScreen}
                addHistory={addHistory}
                isOnline={isOnline}
             />
          );
      case Screen.WALLET:
        return (
          <WalletScreen 
            user={currentUser} 
            setScreen={handleSetScreen} 
            setUser={setCurrentUser}
            transactions={transactions}
            addTransaction={addTransaction}
            returnScreen={returnScreen}
          />
        );
      case Screen.HISTORY:
        return <HistoryScreen history={history} setScreen={handleSetScreen} />;
      case Screen.PROFILE:
        return (
            <ProfileScreen 
                user={currentUser} 
                setUser={setCurrentUser}
                setScreen={handleSetScreen} 
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                language={language}
                setLanguage={setLanguage}
            />
        );
      default:
        return <HomeScreen 
            user={currentUser} 
            setScreen={handleSetScreen} 
        />;
    }
  };

  // Wrap User screens in Layout, but return Admin/Auth screens directly
  if (isAuthenticated && currentScreen !== Screen.ADMIN) {
      return (
        <Layout 
            currentScreen={currentScreen} 
            setScreen={handleSetScreen} 
            isAdmin={isAdmin} 
            onLogout={handleLogout}
            language={language}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
        >
            {renderScreen()}
        </Layout>
      );
  }

  return renderScreen();
};

export default App;
