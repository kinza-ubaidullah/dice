
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
import { Dices, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true); // App Loader State
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [betAmount, setBetAmount] = useState<number>(500);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Global Settings (Shared between Admin and Game)
  const [commissionRate, setCommissionRate] = useState<number>(5); // Default 5%
  
  // Language State with Persistence
  const [language, setLanguage] = useState<string>(() => {
      return localStorage.getItem('app_language') || 'English';
  });

  // --- MOCK DATABASE START ---
  // Initial Mock Users (Admin & Demo User) with LocalStorage Persistence
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('app_users');
      if (savedUsers) {
        return JSON.parse(savedUsers);
      }
    } catch (e) {
      console.error("Failed to parse users from local storage", e);
    }
    
    // Default Data if no local storage
    return [
      {
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin',
        password: 'admin',
        balance: 1000000,
        avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=random',
        role: 'ADMIN'
      },
      {
        id: 'demo-user-id',
        name: 'HHH HHH',
        email: 'user', 
        password: 'user',
        balance: 50.00,
        avatarUrl: 'https://picsum.photos/100/100',
        role: 'USER'
      }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User>(registeredUsers[1]); 
  // --- MOCK DATABASE END ---

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

  // SPLASH SCREEN LOADER EFFECT
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // PERSISTENCE EFFECT 1: Save Users to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // PERSISTENCE EFFECT 2: Sync Current User changes (balance, profile) back to Registered Users list
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setRegisteredUsers(prevUsers => 
        prevUsers.map(user => user.id === currentUser.id ? currentUser : user)
      );
    }
  }, [currentUser, isAuthenticated]);

  // PERSISTENCE EFFECT 3: Save Transactions
  useEffect(() => {
      localStorage.setItem('app_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // PERSISTENCE EFFECT 4: Save Language
  useEffect(() => {
      localStorage.setItem('app_language', language);
  }, [language]);


  const addHistory = (record: GameRecord) => {
    setHistory(prev => [...prev, record]);
  };

  const addTransaction = (tx: Transaction) => {
      setTransactions(prev => [tx, ...prev]);
  };

  // Handle Registration
  const handleRegister = (newUser: User) => {
    // Check if user already exists
    const exists = registeredUsers.find(u => u.email === newUser.email);
    if (exists) {
      alert("User with this email already exists!");
      return false;
    }

    // Give 1000 CFA welcome bonus
    const userWithBonus = { 
      ...newUser, 
      balance: 1000, 
      avatarUrl: `https://ui-avatars.com/api/?name=${newUser.name}&background=random` 
    };

    setRegisteredUsers(prev => [...prev, userWithBonus]); 
    alert("Registration Successful! Please Login.");
    setCurrentScreen(Screen.LOGIN);
    return true;
  };

  // Handle Login
  const handleLogin = (identifier: string, pass: string) => {
    // Check against Email, Phone, OR Name (Username)
    const foundUser = registeredUsers.find(u => 
      (u.email === identifier || u.phone === identifier || u.name === identifier) && u.password === pass
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      
      if (foundUser.role === 'ADMIN' || foundUser.email === 'admin') {
        setIsAdmin(true);
        setCurrentScreen(Screen.ADMIN);
      } else {
        setIsAdmin(false);
        setCurrentScreen(Screen.HOME);
      }
      return true;
    } else {
      alert("Invalid Credentials! Please check username/email/password.");
      return false;
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCurrentScreen(Screen.LOGIN);
  };

  // Global User Management Handlers
  const handleUpdateUser = (updatedUser: User) => {
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If we updated the currently logged in user, update local state too
    if (currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
      setRegisteredUsers(prev => prev.filter(u => u.id !== userId));
      // If deleting self, logout
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
               <span>Initializing Game Engine...</span>
            </div>
         </div>
      </div>
    );
  }

  const renderScreen = () => {
    // Unauthenticated Routes
    if (!isAuthenticated) {
        if (currentScreen === Screen.REGISTER) {
            return <RegisterScreen setScreen={setCurrentScreen} onRegister={handleRegister} />;
        }
        return <LoginScreen onLogin={handleLogin} setScreen={setCurrentScreen} registeredUsers={registeredUsers} />;
    }

    // Admin Dashboard Screen (Isolated from Layout)
    if (currentScreen === Screen.ADMIN) {
        return (
            <AdminDashboard 
                onLogout={handleLogout} 
                commissionRate={commissionRate}
                setCommissionRate={setCommissionRate}
                onEnterGame={() => setCurrentScreen(Screen.HOME)}
                users={registeredUsers}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        );
    }

    // Authenticated User Routes (Wrapped in Layout)
    switch (currentScreen) {
      case Screen.HOME:
        return (
          <HomeScreen 
            user={currentUser} 
            setScreen={setCurrentScreen} 
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
            setScreen={setCurrentScreen}
            commissionRate={commissionRate} 
          />
        );
      case Screen.WALLET:
        return (
          <WalletScreen 
            user={currentUser} 
            setScreen={setCurrentScreen} 
            setUser={setCurrentUser}
            transactions={transactions}
            addTransaction={addTransaction}
          />
        );
      case Screen.HISTORY:
        return <HistoryScreen history={history} setScreen={setCurrentScreen} />;
      case Screen.PROFILE:
        return (
            <ProfileScreen 
                user={currentUser} 
                setUser={setCurrentUser}
                setScreen={setCurrentScreen} 
                onLogout={handleLogout}
                registeredUsers={registeredUsers}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                language={language}
                setLanguage={setLanguage}
            />
        );
      default:
        return <HomeScreen 
            user={currentUser} 
            setScreen={setCurrentScreen} 
        />;
    }
  };

  // Wrap User screens in Layout, but return Admin/Auth screens directly
  if (isAuthenticated && currentScreen !== Screen.ADMIN) {
      return (
        <Layout 
            currentScreen={currentScreen} 
            setScreen={setCurrentScreen} 
            isAdmin={isAdmin} 
            onLogout={handleLogout}
        >
            {renderScreen()}
        </Layout>
      );
  }

  return renderScreen();
};

export default App;
