
import React, { useState, useRef, useEffect } from 'react';
import { User, Screen, GameRecord } from '../types';
import { ChevronLeft, Wallet, Volume2, VolumeX, WifiOff, AlertTriangle, RefreshCw, Hand, Info, Crown, Check, XCircle } from 'lucide-react';
import Dice from '../components/Dice';
import NeonButton from '../components/NeonButton';
import { audioManager } from '../utils/audio';
import { gameApi } from '../utils/api';
import { translate } from '../utils/i18n';

interface DiceTableScreenProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setScreen: (screen: Screen) => void;
  addHistory: (record: GameRecord) => void;
  isOnline?: boolean;
  language: string;
}

const DiceTableScreen: React.FC<DiceTableScreenProps> = ({ user, setUser, setScreen, addHistory, isOnline = true, language }) => {
  // State for individual bets: { [diceNumber]: betAmount }
  const [bets, setBets] = useState<Record<number, number>>({});
  const [activeMenuNum, setActiveMenuNum] = useState<number | null>(null);
  const [betMode, setBetMode] = useState<'STD' | 'VIP'>('STD');
  const [customBetInput, setCustomBetInput] = useState('');
  
  const [diceValue, setDiceValue] = useState<number>(1);
  const [gameState, setGameState] = useState<'IDLE' | 'ROLLING' | 'RESULT'>('IDLE');
  const [resultMessage, setResultMessage] = useState<{ text: string, type: 'WIN' | 'LOSS' | null }>({ text: '', type: null });
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [showNoBetModal, setShowNoBetModal] = useState(false);
  const [localFallback, setLocalFallback] = useState(false);

  // Betting Options Configuration
  const BET_OPTIONS_STD = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  const BET_OPTIONS_VIP = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
  
  const MULTIPLIER = 5; 

  const totalBet = (Object.values(bets) as number[]).reduce((sum: number, amount: number) => sum + amount, 0);

  // Long Press Refs
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // Reset custom input when menu changes
  useEffect(() => {
      setCustomBetInput('');
  }, [activeMenuNum]);

  const toggleMute = () => {
      setIsMuted(audioManager.toggleMute());
  };

  const handleTouchStart = (num: number) => {
      if (gameState !== 'IDLE') return;
      isLongPress.current = false;
      pressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          setActiveMenuNum(num);
          audioManager.play('CLICK');
      }, 600); // 600ms for long press
  };

  const handleTouchEnd = (e: React.MouseEvent | React.TouchEvent, num: number) => {
      if (gameState !== 'IDLE') return;
      e.preventDefault(); // Prevent ghost clicks
      
      if (pressTimer.current) {
          clearTimeout(pressTimer.current);
          pressTimer.current = null;
      }

      // If it wasn't a long press
      if (!isLongPress.current) {
          // If menu is open, tapping the number again or another number closes it
          if (activeMenuNum !== null) {
              setActiveMenuNum(null);
          } else if (bets[num]) {
              // Tapping a selected number removes the bet
              const newBets = { ...bets };
              delete newBets[num];
              setBets(newBets);
              audioManager.play('CLICK');
          }
      }
  };

  const handleSelectBet = (e: React.MouseEvent | React.TouchEvent, num: number, amount: number) => {
      e.stopPropagation();
      setBets(prev => ({ ...prev, [num]: amount }));
      setActiveMenuNum(null);
      audioManager.play('CLICK');
  };

  const handleCustomSubmit = (num: number) => {
      if (!customBetInput) return;
      const val = parseInt(customBetInput);
      if (!isNaN(val) && val > 0) {
          setBets(prev => ({ ...prev, [num]: val }));
          setActiveMenuNum(null);
          audioManager.play('CLICK');
      }
  };

  const handleReset = () => {
      audioManager.play('CLICK');
      setGameState('IDLE');
      setBets({});
      setResultMessage({ text: '', type: null });
      setActiveMenuNum(null);
  };

  const handleRoll = async () => {
      // 1. Priority Check: Wallet Empty?
      // If user has 0 or very low balance, prompt deposit immediately, 
      // regardless of whether they selected a number or not.
      if (user.wallet.balance <= 0) {
          audioManager.play('LOSS');
          setShowLowBalanceModal(true);
          return;
      }

      // 2. Check if any bet is placed
      if (totalBet === 0) {
          audioManager.play('LOSS');
          setShowNoBetModal(true);
          return;
      }

      // 3. Check if balance covers the specific bet
      if (user.wallet.balance < totalBet) {
          audioManager.play('LOSS');
          setShowLowBalanceModal(true);
          return;
      }

      // Deduct Funds & Update Stats (Wagered + Played)
      setUser(prev => ({
          ...prev,
          wallet: { ...prev.wallet, balance: prev.wallet.balance - totalBet },
          stats: {
              ...prev.stats,
              gamesPlayed: prev.stats.gamesPlayed + 1,
              totalWagered: prev.stats.totalWagered + totalBet
          }
      }));

      setGameState('ROLLING');
      audioManager.play('ROLL');
      setResultMessage({ text: '', type: null });
      setActiveMenuNum(null); // Close any open menus

      // Start Visual Rolling Animation
      let animationRolls = 0;
      const animationInterval = setInterval(() => {
          setDiceValue(Math.floor(Math.random() * 6) + 1);
          animationRolls++;
      }, 100);

      try {
          let finalVal = 1;
          const shouldUseApi = isOnline && !localFallback;

          // --- HOUSE EDGE LOGIC ---
          // If player covers ALL options (selects all 6), force the result to be 1.
          if (Object.keys(bets).length === 6) {
              finalVal = 1;
              setTimeout(() => {
                  clearInterval(animationInterval);
                  finalizeGame(finalVal);
              }, 1500);
              return;
          }
          
          if (shouldUseApi) {
              try {
                  const playersPayload = [
                      { uid: user.id, displayName: user.name },
                      { uid: 'dealer-bot', displayName: 'Dealer' } 
                  ];

                  const apiResponse = await gameApi.rollDice(playersPayload);
                  
                  if (Array.isArray(apiResponse)) {
                      const myResult = apiResponse.find((r: any) => r.uid === user.id);
                      if (myResult && typeof myResult.rollDiceResult === 'number') {
                          finalVal = myResult.rollDiceResult;
                      } else {
                          finalVal = Math.floor(Math.random() * 6) + 1;
                      }
                  } else {
                       finalVal = Math.floor(Math.random() * 6) + 1;
                  }
              } catch (e) {
                  console.warn("API Roll Failed, switching to local RNG", e);
                  setLocalFallback(true);
                  finalVal = Math.floor(Math.random() * 6) + 1;
              }
          } else {
              await new Promise(resolve => setTimeout(resolve, 1000));
              finalVal = Math.floor(Math.random() * 6) + 1;
          }

          setTimeout(() => {
              clearInterval(animationInterval);
              finalizeGame(finalVal);
          }, 1500);

      } catch (e) {
          clearInterval(animationInterval);
          finalizeGame(Math.floor(Math.random() * 6) + 1);
      }
  };

  const finalizeGame = (finalValue: number) => {
      setDiceValue(finalValue);
      setGameState('RESULT');

      // Rule: Number 1 is strictly House Property.
      const isHouseWin = finalValue === 1;
      
      const winningBetAmount = bets[finalValue] || 0;
      const isWin = !isHouseWin && winningBetAmount > 0;
      const winAmount = winningBetAmount * MULTIPLIER;
      
      if (isWin) {
          audioManager.play('WIN');
          setResultMessage({ text: `${translate('Win Caps', language)} +${winAmount.toLocaleString()}`, type: 'WIN' });
      } else {
          audioManager.play('LOSS');
          if (isHouseWin) {
              setResultMessage({ text: translate('House Wins Specific', language), type: 'LOSS' });
          } else {
              setResultMessage({ text: translate('Loss Caps', language), type: 'LOSS' });
          }
      }

      // Update User (Wallet + Stats)
      setUser(prev => ({
          ...prev,
          wallet: { 
              ...prev.wallet, 
              balance: prev.wallet.balance + (isWin ? winAmount : 0)
          },
          stats: {
              ...prev.stats,
              gamesWon: isWin ? prev.stats.gamesWon + 1 : prev.stats.gamesWon,
              totalWon: prev.stats.totalWon + (isWin ? winAmount : 0)
          }
      }));

      addHistory({
          id: Date.now().toString(),
          date: new Date().toLocaleTimeString(),
          betAmount: totalBet,
          userScore: 0,
          opponentScore: finalValue,
          result: isWin ? 'WIN' : 'LOSS'
      });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#111] overflow-hidden animate-fade-in text-white font-body select-none" onClick={() => { if(activeMenuNum !== null) setActiveMenuNum(null); }}>
      
      {/* 1. TOP BAR */}
      <div className="shrink-0 h-[60px] px-4 flex items-center justify-between bg-[#0B0C10] border-b border-gray-800 z-50">
        <button onClick={() => setScreen(Screen.HOME)} className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
             <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{translate('Balance Caps', language)}</span>
             <span className="font-digital text-neon text-xl font-bold tracking-wider leading-none">
                {user.wallet.balance.toLocaleString()}
             </span>
        </div>
        <div className="flex items-center gap-2">
            {(!isOnline || localFallback) && <WifiOff size={16} className="text-red-500" title="Offline Mode" />}
            <button onClick={toggleMute} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
      </div>

      {/* 2. GAME AREA */}
      <div className="flex-1 relative w-full flex flex-col items-center justify-start bg-[#0B0C10] p-4 pt-12 md:pt-20 overflow-y-auto gap-6">
         
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1F2833] via-[#0B0C10] to-[#000000] opacity-50 pointer-events-none"></div>

         {/* Dice Rolling Area */}
         <div className="shrink-0 z-20 w-full flex flex-col items-center justify-center h-40 relative">
             <div className="w-24 h-24 bg-[#E8DCC4] rounded-xl border-4 border-black flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-visible">
                 <Dice value={diceValue} isRolling={gameState === 'ROLLING'} color="danger" size="md" />
             </div>
             
             {/* Result Message */}
             {gameState === 'RESULT' && (
                 <div className={`mt-6 px-6 py-2 border-2 font-black text-xl uppercase tracking-widest animate-bounce-small shadow-lg absolute -bottom-4 z-30 whitespace-nowrap ${
                     resultMessage.type === 'WIN' 
                     ? 'bg-gold text-black border-white' 
                     : 'bg-red-500 text-white border-red-700'
                 }`}>
                     {resultMessage.text}
                 </div>
             )}
         </div>

         {/* THE BOARD */}
         <div className="relative w-full max-w-[400px] z-10 p-4 rounded bg-[#8B5A2B] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-b-8 border-r-8 border-[#5C3A1E]">
             
             {/* The Grid */}
             <div className="grid grid-cols-3 grid-rows-2 gap-2 bg-black border-4 border-black aspect-[4/3]">
                 {[1, 2, 3, 4, 5, 6].map((num) => {
                     const myBet = bets[num];
                     const isSelected = myBet !== undefined;
                     const isWinningNum = gameState === 'RESULT' && diceValue === num;
                     const isMenuOpen = activeMenuNum === num;
                     
                     return (
                        <div 
                            key={num} 
                            className="relative w-full h-full"
                            onMouseEnter={() => {
                                // Desktop Hover Logic
                                if (gameState === 'IDLE' && window.matchMedia('(hover: hover)').matches) {
                                    setActiveMenuNum(num);
                                }
                            }}
                            onMouseLeave={() => {
                                // Desktop Hover Logic
                                if (gameState === 'IDLE' && window.matchMedia('(hover: hover)').matches) {
                                    setActiveMenuNum(null);
                                }
                            }}
                        >
                            {/* Betting Menu Popover */}
                            {isMenuOpen && (
                                <div 
                                    className={`
                                        absolute left-1/2 -translate-x-1/2 z-[60] flex flex-col bg-black/95 backdrop-blur-md border border-gray-700 rounded-xl p-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-fade-in-up min-w-[170px]
                                        top-[80%]
                                    `}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    
                                    {/* Mode Toggle */}
                                    <div className="flex p-1 bg-gray-900 rounded-lg mb-2 border border-gray-800">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setBetMode('STD'); }}
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all ${betMode === 'STD' ? 'bg-neon text-black shadow-[0_0_10px_#66FCF1]' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            STD
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setBetMode('VIP'); }}
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 ${betMode === 'VIP' ? 'bg-gold text-black shadow-[0_0_10px_#FFD700]' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            <Crown size={10} /> VIP
                                        </button>
                                    </div>

                                    {/* Options Grid */}
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {(betMode === 'STD' ? BET_OPTIONS_STD : BET_OPTIONS_VIP).map(amount => (
                                            <button 
                                                key={amount}
                                                onClick={(e) => handleSelectBet(e, num, amount)}
                                                className={`
                                                    py-2 px-1 rounded text-white font-digital font-bold text-sm transition-colors border
                                                    ${betMode === 'VIP' 
                                                        ? 'bg-gold/10 border-gold/30 hover:bg-gold hover:text-black' 
                                                        : 'bg-gray-800 border-gray-700 hover:bg-neon hover:text-black'
                                                    }
                                                `}
                                            >
                                                {amount}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Custom Input */}
                                    <div className="mt-2 pt-2 border-t border-gray-800 flex gap-2">
                                        <input 
                                            type="number"
                                            value={customBetInput}
                                            onChange={(e) => setCustomBetInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit(num)}
                                            placeholder={translate('Custom', language)}
                                            className="w-full bg-black/40 border border-gray-600 rounded px-2 py-1.5 text-xs text-white focus:border-neon outline-none font-digital"
                                        />
                                        <button 
                                            onClick={() => handleCustomSubmit(num)}
                                            className="bg-neon text-black p-1.5 rounded hover:bg-neonDim transition-colors"
                                        >
                                            <Check size={14} strokeWidth={3} />
                                        </button>
                                    </div>

                                    {/* Triangle Pointer - Always Point UP because menu is below */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-700"></div>
                                </div>
                            )}

                            <button
                                onMouseDown={() => handleTouchStart(num)}
                                onMouseUp={(e) => handleTouchEnd(e, num)}
                                onTouchStart={() => handleTouchStart(num)}
                                onTouchEnd={(e) => handleTouchEnd(e, num)}
                                onContextMenu={(e) => e.preventDefault()}
                                disabled={gameState === 'ROLLING' || gameState === 'RESULT'}
                                className={`
                                    w-full h-full relative flex items-center justify-center transition-all duration-100
                                    ${isSelected ? 'bg-black text-white' : 'bg-[#E8DCC4] hover:bg-[#D8CCB4] text-black'}
                                    ${isWinningNum ? '!bg-gold !text-black animate-pulse' : ''}
                                    active:scale-95
                                `}
                            >
                                <span className="font-sans font-bold text-6xl md:text-7xl leading-none select-none pointer-events-none">
                                    {num}
                                </span>
                                
                                {/* Bet Indicator (Chip) */}
                                {isSelected && (
                                    <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 border border-black shadow-lg rounded px-1.5 py-0.5 min-w-[40px] flex items-center justify-center animate-fade-in z-10 pointer-events-none ${myBet >= 1000 ? 'bg-gold text-black' : 'bg-neon text-black'}`}>
                                        <span className="text-[10px] sm:text-xs font-black font-digital leading-none">
                                            {myBet}
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>
                     );
                 })}
             </div>
         </div>
         
         <div className="flex items-center gap-2 text-gray-500 mt-2">
             <Hand size={14} className="animate-bounce" />
             <p className="text-xs font-mono tracking-widest uppercase text-center">
                 {translate('Hover Hint', language)}
             </p>
         </div>

      </div>

      {/* 3. CONTROL PANEL */}
      <div className="shrink-0 bg-[#0B0C10] border-t border-gray-800 p-4 pb-safe z-50">
          <div className="max-w-md mx-auto flex flex-col gap-4">
              
              <div className="flex justify-between items-center bg-[#151a21] p-3 rounded-xl border border-gray-800">
                  <div className="flex flex-col">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{translate('Total Wager', language)}</span>
                      <span className={`font-digital font-bold text-2xl ${totalBet > 0 ? 'text-neon' : 'text-gray-600'}`}>
                          {totalBet.toLocaleString()} CFA
                      </span>
                  </div>
                  {totalBet > 0 && (
                      <div className="flex flex-col items-end">
                           <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{translate('Potential Win', language)}</span>
                           <span className="font-digital font-bold text-xl text-gold">
                              {(Math.max(...(Object.values(bets) as number[])) * MULTIPLIER).toLocaleString()} CFA
                           </span>
                      </div>
                  )}
              </div>

              {/* Action Button */}
              {gameState === 'RESULT' ? (
                  <NeonButton 
                        fullWidth 
                        variant="secondary" 
                        onClick={handleReset} 
                        className="h-14 text-xl tracking-widest font-black"
                    >
                        <RefreshCw size={24} className="mr-2" /> {translate('Try Again', language)}
                  </NeonButton>
              ) : (
                  <NeonButton 
                        fullWidth 
                        variant="primary" 
                        onClick={handleRoll} 
                        disabled={gameState === 'ROLLING'}
                        className="h-14 text-xl tracking-widest font-black"
                    >
                        {gameState === 'ROLLING' ? translate('Rolling Caps', language) : translate('Start Game Caps', language)}
                  </NeonButton>
              )}
          </div>
      </div>

      {/* MODALS */}
      {showLowBalanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151a21] border border-red-500/50 p-6 rounded-2xl w-full max-w-sm text-center shadow-[0_0_30px_rgba(255,76,76,0.2)]">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500">
                    <Wallet size={32} className="text-red-500" />
                </div>
                <h3 className="text-white font-title text-xl mb-2">{translate('Insuff Funds', language)}</h3>
                <p className="text-gray-400 text-sm mb-6">
                    {totalBet > 0 ? (
                        <>{translate('Total Bet Is', language)} <span className="text-white font-bold">{totalBet.toLocaleString()} CFA</span>.</>
                    ) : (
                        <>{translate('Need Funds', language)}</>
                    )}
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setShowLowBalanceModal(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">{translate('Cancel', language)}</button>
                    <NeonButton variant="primary" className="flex-1" onClick={() => setScreen(Screen.WALLET)}>{translate('Deposit Caps', language)}</NeonButton>
                </div>
            </div>
        </div>
      )}

      {/* NO BET SELECTED MODAL */}
      {showNoBetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowNoBetModal(false)}>
            <div className="bg-[#151a21] border border-yellow-500/50 p-6 rounded-2xl w-full max-w-sm text-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500">
                    <AlertTriangle size={32} className="text-yellow-500" />
                </div>
                <h3 className="text-white font-title text-xl mb-2">{translate('No Bet Placed', language)}</h3>
                <p className="text-gray-400 text-sm mb-6">
                    {translate('No Bet Msg', language)}
                </p>
                <NeonButton variant="secondary" fullWidth onClick={() => setShowNoBetModal(false)}>
                    {translate('Ok Pick', language)}
                </NeonButton>
            </div>
        </div>
      )}
    </div>
  );
};

export default DiceTableScreen;
