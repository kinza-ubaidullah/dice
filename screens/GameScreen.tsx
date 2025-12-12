
import React, { useState, useEffect, useRef } from 'react';
import { User, GameRecord, Screen } from '../types';
import Dice from '../components/Dice';
import NeonButton from '../components/NeonButton';
import { ChevronLeft, RefreshCw, Plus, Minus, ArrowUpCircle, ArrowDownCircle, Volume2, VolumeX, Percent, Users, Search, Wallet, WifiOff } from 'lucide-react';
import { audioManager } from '../utils/audio';
import { gameApi } from '../utils/api';

interface GameScreenProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  playerCount: number;
  setPlayerCount: (count: number) => void;
  addHistory: (record: GameRecord) => void;
  setScreen: (screen: Screen) => void;
  commissionRate: number;
  isOnline?: boolean;
}

// RULES IMPLEMENTATION:
// 1 or 2 Players: Single Bet, One Opponent (1 vs 1).
// 3 to 5 Players: Double Bet, Two Opponents (Left & Right Rivals).
const isDuelMode = (count: number) => count >= 3;

const BOT_NAMES = ['NeonKing', 'SpeedRoller', 'LuckyStrike', 'CyberWolf', 'DiceMaster', 'Viper', 'Ghost', 'ZeroCool'];

const GameScreen: React.FC<GameScreenProps> = ({ 
    user, setUser, betAmount, setBetAmount, playerCount, setPlayerCount, addHistory, setScreen, commissionRate, isOnline = true 
}) => {
  const [gameState, setGameState] = useState<'READY' | 'MATCHING' | 'ROLLING' | 'RESULT'>('READY');
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const isGameActive = gameState !== 'READY';
  
  const [myDice, setMyDice] = useState<[number, number]>([1, 1]);
  const [leftDice, setLeftDice] = useState<[number, number]>([1, 1]);
  const [rightDice, setRightDice] = useState<[number, number]>([1, 1]); 

  // Opponent Names (Simulate Multiplayer)
  const [leftOpponent, setLeftOpponent] = useState('Opponent');
  const [rightOpponent, setRightOpponent] = useState('Right Rival');
  
  const [duelResults, setDuelResults] = useState<{
    left: 'WIN' | 'LOSS' | 'DRAW' | null;
    right: 'WIN' | 'LOSS' | 'DRAW' | null;
    netAmount: number;
    feePaid: number;
  }>({ left: null, right: null, netAmount: 0, feePaid: 0 });

  // Refs for animation
  const animationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bet Calculation Logic
  const activeDuels = isDuelMode(playerCount) ? 2 : 1;
  const totalBetRequired = betAmount * activeDuels;

  const MIN_BET = 500;

  useEffect(() => {
    return () => {
        if (animationInterval.current) clearInterval(animationInterval.current);
    };
  }, []);

  const handleBetChange = (delta: number) => {
    setBetAmount(Math.max(MIN_BET, betAmount + delta));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val)) {
          setBetAmount(val);
      } else {
          setBetAmount(0); // Intermediate state while typing
      }
  };

  const handleInputBlur = () => {
      if (betAmount < MIN_BET) {
          setBetAmount(MIN_BET);
      }
  };

  const toggleMute = () => {
      const muted = audioManager.toggleMute();
      setIsMuted(muted);
  };

  const handleStartGame = () => {
    // 1. Strict Deposit Rule (Use Wallet.Balance)
    if (user.wallet.balance < totalBetRequired) {
      audioManager.play('LOSS');
      setShowLowBalanceModal(true);
      return;
    }

    if (betAmount < MIN_BET) {
        alert(`Minimum bet is ${MIN_BET} CFA`);
        setBetAmount(MIN_BET);
        return;
    }

    // Play Click Sound
    audioManager.play('CLICK');

    // 2. Start Multiplayer Matching Phase
    setGameState('MATCHING');
    
    // Pick random opponents
    const availableBots = [...BOT_NAMES].sort(() => 0.5 - Math.random());
    setLeftOpponent(availableBots[0]);
    if (isDuelMode(playerCount)) setRightOpponent(availableBots[1]);

    // Simulate Network Matchmaking Delay
    setTimeout(() => {
        executeGameLogic();
    }, 1500);
  };

  const executeGameLogic = async () => {
    setGameState('ROLLING');
    audioManager.play('ROLL');
    
    // Deduct total bet immediately (Escrow)
    setUser(prev => ({ 
        ...prev, 
        wallet: {
            ...prev.wallet,
            balance: prev.wallet.balance - totalBetRequired
        }
    }));

    // Start Visual Rolling Animation (Loops until API returns)
    animationInterval.current = setInterval(() => {
      setMyDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      setLeftDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      if (isDuelMode(playerCount)) {
          setRightDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      }
    }, 100);

    // DETERMINE RESULTS
    let myTotal = 0;
    let leftTotal = 0;
    let rightTotal = 0;

    if (isOnline) {
        // --- ONLINE API MODE ---
        try {
            // Construct Payload for API
            // Note: The API takes an array of players. Since we don't have real matchmaking yet,
            // we send the user + dummy bots to the API, so the API calculates dice for everyone.
            const playersPayload = [
                { uid: user.id, displayName: user.name }, // Me
                { uid: 'bot-1', displayName: leftOpponent } // Bot 1
            ];
            if (isDuelMode(playerCount)) {
                playersPayload.push({ uid: 'bot-2', displayName: rightOpponent }); // Bot 2
            }

            const apiResponse = await gameApi.rollDice(playersPayload);
            
            // Wait a minimum time for animation
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (Array.isArray(apiResponse)) {
                // Extract My Result
                const myResult = apiResponse.find((r: any) => r.uid === user.id);
                const myRoll = myResult ? myResult.rollDiceResult : 2;
                // Split single API result into 2 dice for visuals (e.g. 7 -> 3+4)
                setMyDice(splitDice(myRoll));
                myTotal = myRoll;

                // Extract Left Bot Result
                const leftResult = apiResponse.find((r: any) => r.uid === 'bot-1');
                const leftRoll = leftResult ? leftResult.rollDiceResult : 2;
                setLeftDice(splitDice(leftRoll));
                leftTotal = leftRoll;

                // Extract Right Bot Result
                if (isDuelMode(playerCount)) {
                    const rightResult = apiResponse.find((r: any) => r.uid === 'bot-2');
                    const rightRoll = rightResult ? rightResult.rollDiceResult : 2;
                    setRightDice(splitDice(rightRoll));
                    rightTotal = rightRoll;
                }
            } else {
                throw new Error("Invalid API format");
            }

        } catch (e) {
            console.error("Online Play Failed", e);
            alert("Connection lost. Switching to offline mode for this roll.");
            // Fallback to local
            ({ myTotal, leftTotal, rightTotal } = runLocalSimulation());
        }
    } else {
        // --- OFFLINE DEMO MODE ---
        await new Promise(resolve => setTimeout(resolve, 2000));
        ({ myTotal, leftTotal, rightTotal } = runLocalSimulation());
    }

    // Stop Animation
    if (animationInterval.current) clearInterval(animationInterval.current);
    
    // Calculate Financials & State
    calculateAndFinalize(myTotal, leftTotal, rightTotal);
  };

  const splitDice = (total: number): [number, number] => {
      // Helper to make visuals match the total
      if (total <= 2) return [1, 1];
      if (total >= 12) return [6, 6];
      const d1 = Math.floor(total / 2);
      const d2 = total - d1;
      return [d1, d2];
  };

  const runLocalSimulation = () => {
      const myD1 = Math.floor(Math.random() * 6) + 1;
      const myD2 = Math.floor(Math.random() * 6) + 1;
      setMyDice([myD1, myD2]);
      
      const l1 = Math.floor(Math.random() * 6) + 1;
      const l2 = Math.floor(Math.random() * 6) + 1;
      setLeftDice([l1, l2]);

      let r1 = 1, r2 = 1, rightTotal = 0;
      if (isDuelMode(playerCount)) {
          r1 = Math.floor(Math.random() * 6) + 1;
          r2 = Math.floor(Math.random() * 6) + 1;
          setRightDice([r1, r2]);
          rightTotal = r1 + r2;
      }

      return {
          myTotal: myD1 + myD2,
          leftTotal: l1 + l2,
          rightTotal
      };
  };

  const calculateAndFinalize = (myTotal: number, leftTotal: number, rightTotal: number) => {
    // Determine Winners & Commission
    let grossWinnings = 0;
    let totalFee = 0;
    let leftResult: 'WIN' | 'LOSS' | 'DRAW' = 'LOSS';
    let rightResult: 'WIN' | 'LOSS' | 'DRAW' | null = null;

    // Helper to calculate win with commission
    const calculateWin = (bet: number) => {
        const pot = bet * 2; // My bet + Opponent bet
        const fee = Math.floor(pot * (commissionRate / 100));
        return { payout: pot - fee, fee };
    };

    // Duel 1: Left Rival
    if (myTotal > leftTotal) {
        leftResult = 'WIN';
        const win = calculateWin(betAmount);
        grossWinnings += win.payout;
        totalFee += win.fee;
    } else if (myTotal === leftTotal) {
        leftResult = 'DRAW';
        grossWinnings += betAmount; // Refund, no commission on draw
    } 

    // Duel 2: Right Rival
    if (isDuelMode(playerCount)) {
        if (myTotal > rightTotal) {
            rightResult = 'WIN';
            const win = calculateWin(betAmount);
            grossWinnings += win.payout;
            totalFee += win.fee;
        } else if (myTotal === rightTotal) {
            rightResult = 'DRAW';
            grossWinnings += betAmount; 
        }
    }

    // Update Balance
    setUser(prev => ({ 
        ...prev, 
        wallet: {
            ...prev.wallet,
            balance: prev.wallet.balance + grossWinnings
        }
    }));

    // Calculate Net Result (Total Payout - Total Initial Bet)
    const netWin = grossWinnings - totalBetRequired;
    setDuelResults({ left: leftResult, right: rightResult, netAmount: netWin, feePaid: totalFee });
    setGameState('RESULT');

    // Play Sound Result
    if (netWin > 0) {
        audioManager.play('WIN');
    } else if (netWin < 0) {
        audioManager.play('LOSS');
    }

    addHistory({
      id: Date.now().toString(),
      date: new Date().toLocaleTimeString(),
      betAmount: totalBetRequired,
      userScore: myTotal,
      opponentScore: leftTotal, // In duel mode, this primarily tracks left opponent for basic history
      result: netWin > 0 ? 'WIN' : netWin < 0 ? 'LOSS' : 'DRAW'
    });
  };

  const resetGame = () => {
    setGameState('READY');
    setDuelResults({ left: null, right: null, netAmount: 0, feePaid: 0 });
  };

  const getResultColor = (res: 'WIN' | 'LOSS' | 'DRAW' | null) => {
      if (res === 'WIN') return 'text-gold';
      if (res === 'LOSS') return 'text-danger';
      return 'text-textMuted';
  };

  const renderBadge = (res: 'WIN' | 'LOSS' | 'DRAW' | null) => {
      if (!res) return null;
      let bgClass = 'bg-gray-600';
      if (res === 'WIN') bgClass = 'bg-gold text-black shadow-lg shadow-gold/50';
      if (res === 'LOSS') bgClass = 'bg-danger text-white shadow-lg shadow-danger/50';
      if (res === 'DRAW') bgClass = 'bg-gray-500 text-white';

      return (
          <div className={`absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded text-[10px] sm:text-xs font-black tracking-wider ${bgClass} animate-fade-in-up`}>
              {res}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${duelResults.netAmount > 0 ? 'opacity-20 bg-gold mix-blend-overlay' : 'opacity-0'}`}></div>

      {/* Top Bar - Sticky */}
      <div className="shrink-0 p-3 flex items-center justify-between bg-panel/90 backdrop-blur border-b border-gray-800 z-10 shadow-lg">
        <button onClick={() => setScreen(Screen.HOME)} className="text-textMuted hover:text-white transition-colors p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
             <span className="text-[10px] text-textMuted uppercase tracking-widest font-bold">Total Wager</span>
             <span className="font-digital text-neon text-lg font-bold tracking-wider drop-shadow-md leading-none">
                {totalBetRequired.toLocaleString()}
             </span>
        </div>
        <div className="flex items-center gap-2">
            {!isOnline && <WifiOff size={16} className="text-red-500" title="Offline Mode" />}
            <button onClick={toggleMute} className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-neon transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-start py-6 sm:py-10 px-4 relative min-h-0 overflow-y-auto w-full">
        
        {/* Dice Area Wrapper */}
        <div className="w-full max-w-[360px] flex flex-col gap-10 sm:gap-14 py-4 relative">
            
            {/* Opponents Area */}
            <div className={`w-full flex ${isDuelMode(playerCount) ? 'justify-between' : 'justify-center'} items-end min-h-[100px]`}>
                {/* Left Opponent */}
                <div className="flex flex-col items-center gap-2 relative">
                    {gameState === 'RESULT' && renderBadge(duelResults.left)}
                    <span className={`text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold ${getResultColor(duelResults.left)}`}>
                        {gameState !== 'READY' ? leftOpponent : (isDuelMode(playerCount) ? 'Player 2' : 'Opponent')}
                    </span>
                    <div className="flex gap-2 bg-black/30 p-2 rounded-xl border border-white/5 relative z-10">
                        <Dice value={leftDice[0]} isRolling={gameState === 'ROLLING'} color="danger" size="sm" />
                        <Dice value={leftDice[1]} isRolling={gameState === 'ROLLING'} color="danger" size="sm" />
                    </div>
                    <div className="font-digital text-lg text-danger min-h-[24px] font-bold">
                       {gameState === 'ROLLING' || gameState === 'RESULT' ? (gameState === 'ROLLING' ? '...' : leftDice[0] + leftDice[1]) : ''}
                    </div>
                </div>

                {/* Right Opponent */}
                {isDuelMode(playerCount) && (
                    <div className="flex flex-col items-center gap-2 relative">
                        {gameState === 'RESULT' && renderBadge(duelResults.right)}
                        <span className={`text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold ${getResultColor(duelResults.right)}`}>
                            {gameState !== 'READY' ? rightOpponent : 'Player 3'}
                        </span>
                        <div className="flex gap-2 bg-black/30 p-2 rounded-xl border border-white/5 relative z-10">
                            <Dice value={rightDice[0]} isRolling={gameState === 'ROLLING'} color="danger" size="sm" />
                            <Dice value={rightDice[1]} isRolling={gameState === 'ROLLING'} color="danger" size="sm" />
                        </div>
                         <div className="font-digital text-lg text-danger min-h-[24px] font-bold">
                           {gameState === 'ROLLING' || gameState === 'RESULT' ? (gameState === 'ROLLING' ? '...' : rightDice[0] + rightDice[1]) : ''}
                        </div>
                    </div>
                )}
            </div>

            {/* VS Badge */}
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                <div className="text-[60px] sm:text-[80px] font-title font-black text-[#1F2833] opacity-40 select-none">VS</div>
            </div>

            {/* User Area */}
            <div className="flex flex-col items-center gap-4 relative z-10 mt-2">
                <span className="text-neon text-[10px] sm:text-xs tracking-[0.2em] uppercase font-bold text-shadow-neon truncate max-w-[150px]">{user.name}</span>
                <div className="flex gap-3 sm:gap-6 bg-black/20 p-3 rounded-2xl border border-white/5">
                    <Dice value={myDice[0]} isRolling={gameState === 'ROLLING'} color={duelResults.netAmount > 0 ? 'gold' : 'neon'} size="lg" />
                    <Dice value={myDice[1]} isRolling={gameState === 'ROLLING'} color={duelResults.netAmount > 0 ? 'gold' : 'neon'} size="lg" />
                </div>
                <div className={`font-digital text-6xl sm:text-5xl font-bold min-h-[48px] transition-all duration-300 ${duelResults.netAmount > 0 ? 'text-gold drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] scale-110' : 'text-white'}`}>
                    {gameState === 'ROLLING' || gameState === 'RESULT' ? (gameState === 'ROLLING' ? '...' : myDice[0] + myDice[1]) : ''}
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 bg-[#151a21] border-t border-gray-800 p-4 sm:p-5 rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.9)] relative z-20">
        
        {/* Controls: Always Visible (Disabled when Rolling) */}
        <div className={`transition-all duration-300 ${isGameActive ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="flex justify-between items-end gap-2 mb-4">
                {/* Player Count */}
                <div className="flex flex-col gap-1 sm:gap-2 flex-1">
                    <span className="text-[9px] sm:text-[10px] text-textMuted uppercase tracking-widest font-bold ml-1">Table Size</span>
                    <div className="flex bg-panel border border-gray-700 rounded-lg p-1 gap-1 justify-between">
                        {[2, 3, 4, 5].map(count => (
                            <button
                                key={count}
                                onClick={() => setPlayerCount(count)}
                                className={`flex-1 h-9 sm:h-10 rounded-md text-xs sm:text-sm font-bold font-digital transition-all ${
                                    playerCount === count 
                                    ? 'bg-neon text-black shadow-[0_0_10px_#66FCF1]' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bet Control */}
                <div className="flex flex-col gap-1 sm:gap-2 items-end">
                    <span className="text-[9px] sm:text-[10px] text-textMuted uppercase tracking-widest font-bold mr-1">Bet Amount (CFA)</span>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 sm:gap-2 bg-panel border border-gray-700 rounded-lg p-1">
                            <button 
                                onClick={() => handleBetChange(-100)}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-black/50 text-neon flex items-center justify-center hover:bg-gray-800 active:scale-95"
                            >
                                <Minus size={16} />
                            </button>
                            
                            <input 
                                type="number" 
                                value={betAmount} 
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                className="bg-transparent text-white font-digital font-bold text-center text-base sm:text-lg w-[80px] focus:outline-none border-b border-transparent focus:border-neon transition-colors"
                            />

                            <button 
                                onClick={() => handleBetChange(100)}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-black/50 text-neon flex items-center justify-center hover:bg-gray-800 active:scale-95"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="h-14 sm:h-16 relative">
            {gameState === 'READY' ? (
                <div className="animate-fade-in-up h-full">
                    <NeonButton fullWidth onClick={handleStartGame} className="h-full text-base sm:text-lg shadow-[0_0_15px_rgba(102,252,241,0.3)]">
                        ROLL ({playerCount > 2 ? '2 DUELS' : '1 VS 1'})
                    </NeonButton>
                </div>
            ) : gameState === 'MATCHING' ? (
                 <div className="text-center h-full flex items-center justify-center bg-black/20 rounded-xl border border-neon/20 gap-3">
                    <div className="animate-spin text-neon"><Search size={20} /></div>
                    <span className="text-neon font-title text-lg sm:text-xl tracking-widest animate-pulse">FINDING PLAYERS...</span>
                </div>
            ) : gameState === 'ROLLING' ? (
                <div className="text-center h-full flex items-center justify-center bg-black/20 rounded-xl border border-neon/20">
                    <span className="text-neon animate-pulse font-title text-lg sm:text-xl tracking-widest">ROLLING...</span>
                </div>
            ) : (
                <div className="flex gap-2 h-full animate-fade-in-up">
                    <div className={`flex flex-col px-3 justify-center items-center rounded-xl border backdrop-blur-sm min-w-[100px] ${
                        duelResults.netAmount > 0 ? 'bg-gold/10 border-gold/50 shadow-[0_0_20px_rgba(255,215,0,0.2)]' : 'bg-black/40 border-white/5'
                    }`}>
                        <p className="text-[9px] uppercase tracking-widest text-textMuted leading-none mb-1">Result</p>
                        <span className={`text-2xl font-title leading-none ${duelResults.netAmount > 0 ? 'text-gold' : duelResults.netAmount < 0 ? 'text-danger' : 'text-white'}`}>
                            {duelResults.netAmount > 0 ? `+${duelResults.netAmount.toLocaleString()}` : duelResults.netAmount.toLocaleString()}
                        </span>
                        {/* Show fee if won */}
                        {duelResults.feePaid > 0 && (
                            <span className="text-[9px] text-red-400 mt-1 flex items-center">
                                <Percent size={8} className="mr-0.5" /> House Fee: {duelResults.feePaid}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1 w-12">
                         <button onClick={() => setScreen(Screen.WALLET)} className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center text-green-400 hover:bg-green-500/20 active:scale-95 transition-all">
                            <ArrowDownCircle size={18} />
                         </button>
                         <button onClick={() => setScreen(Screen.WALLET)} className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20 active:scale-95 transition-all">
                             <ArrowUpCircle size={18} />
                         </button>
                    </div>

                    <div className="flex-1">
                        <NeonButton fullWidth variant={duelResults.netAmount > 0 ? 'gold' : 'secondary'} onClick={resetGame} className="h-full">
                            <RefreshCw className="mr-2" /> AGAIN
                        </NeonButton>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* INSUFFICIENT FUNDS MODAL */}
      {showLowBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-panel border border-danger/50 p-6 rounded-2xl w-full max-w-sm text-center shadow-[0_0_30px_rgba(255,76,76,0.2)]">
                <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger">
                    <Wallet size={32} className="text-danger" />
                </div>
                <h3 className="text-white font-title text-xl mb-2">Insufficient Funds</h3>
                <p className="text-gray-400 text-sm mb-6">
                    You need at least <span className="text-white font-bold">{totalBetRequired.toLocaleString()} CFA</span> to roll.
                    <br/>Your Balance: <span className="text-danger font-digital">{user.wallet.balance.toLocaleString()} CFA</span>
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowLowBalanceModal(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <NeonButton 
                        variant="primary" 
                        className="flex-1"
                        onClick={() => setScreen(Screen.WALLET)}
                    >
                        DEPOSIT NOW
                    </NeonButton>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
