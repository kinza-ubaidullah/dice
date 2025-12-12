
import React, { useState, useEffect } from 'react';
import { User, Screen, GameRecord } from '../types';
import { ChevronLeft, Wallet, Volume2, VolumeX, Plus, Minus, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import Dice from '../components/Dice';
import NeonButton from '../components/NeonButton';
import { audioManager } from '../utils/audio';
import { gameApi } from '../utils/api';

interface DiceTableScreenProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setScreen: (screen: Screen) => void;
  addHistory: (record: GameRecord) => void;
  isOnline?: boolean;
}

const DiceTableScreen: React.FC<DiceTableScreenProps> = ({ user, setUser, setScreen, addHistory, isOnline = true }) => {
  const [betPerNumber, setBetPerNumber] = useState<number>(1000);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [gameState, setGameState] = useState<'IDLE' | 'ROLLING' | 'RESULT'>('IDLE');
  const [resultMessage, setResultMessage] = useState<{ text: string, type: 'WIN' | 'LOSS' | null }>({ text: '', type: null });
  const [isMuted, setIsMuted] = useState(audioManager.isMuted());
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [localFallback, setLocalFallback] = useState(false);

  const MIN_BET = 100;
  const MULTIPLIER = 5; 

  const totalBet = betPerNumber * selectedNumbers.length;

  const handleBetChange = (delta: number) => {
    setBetPerNumber(Math.max(MIN_BET, betPerNumber + delta));
  };

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val)) setBetPerNumber(val);
  };

  const handleBetInputBlur = () => {
      if (betPerNumber < MIN_BET) setBetPerNumber(MIN_BET);
  };

  const toggleMute = () => {
      setIsMuted(audioManager.toggleMute());
  };

  const handleNumberToggle = (num: number) => {
      if (gameState === 'ROLLING' || gameState === 'RESULT') return; // Disable selection in result state too until reset
      audioManager.play('CLICK');
      
      setSelectedNumbers(prev => {
          if (prev.includes(num)) {
              return prev.filter(n => n !== num);
          } else {
              return [...prev, num];
          }
      });
      setResultMessage({ text: '', type: null });
  };

  const handleReset = () => {
      audioManager.play('CLICK');
      setGameState('IDLE');
      setSelectedNumbers([]);
      setResultMessage({ text: '', type: null });
  };

  const handleRoll = async () => {
      if (selectedNumbers.length === 0) {
          alert("Select at least one number!");
          return;
      }

      // 1. Priority Check: Insufficient Funds
      if (user.wallet.balance < totalBet) {
          audioManager.play('LOSS');
          setShowLowBalanceModal(true);
          return;
      }

      // Deduct Funds
      setUser(prev => ({
          ...prev,
          wallet: { ...prev.wallet, balance: prev.wallet.balance - totalBet }
      }));

      setGameState('ROLLING');
      audioManager.play('ROLL');
      setResultMessage({ text: '', type: null });

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
          // Since 1 is the House Number (Loss), this prevents guaranteed wins.
          if (selectedNumbers.length === 6) {
              finalVal = 1;
              // Skip API/RNG if forcing logic applies
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
      // If result is 1, player loses regardless of their selection.
      const isHouseWin = finalValue === 1;
      const isWin = !isHouseWin && selectedNumbers.includes(finalValue);
      
      if (isWin) {
          // Prize is equal to 5 times the player's bet on the winning number
          const winAmount = betPerNumber * MULTIPLIER;
          
          setUser(prev => ({
              ...prev,
              wallet: { 
                  ...prev.wallet, 
                  balance: prev.wallet.balance + winAmount,
                  totalDeposited: prev.wallet.totalDeposited 
              }
          }));
          audioManager.play('WIN');
          setResultMessage({ text: `WIN +${winAmount.toLocaleString()}`, type: 'WIN' });
      } else {
          audioManager.play('LOSS');
          if (isHouseWin) {
              setResultMessage({ text: 'HOUSE WINS (#1)', type: 'LOSS' });
          } else {
              setResultMessage({ text: 'LOSS', type: 'LOSS' });
          }
      }

      addHistory({
          id: Date.now().toString(),
          date: new Date().toLocaleTimeString(),
          betAmount: totalBet,
          userScore: 0, // Placeholder for this game mode
          opponentScore: finalValue,
          result: isWin ? 'WIN' : 'LOSS'
      });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#111] overflow-hidden animate-fade-in text-white font-body select-none">
      
      {/* 1. TOP BAR */}
      <div className="shrink-0 h-[60px] px-4 flex items-center justify-between bg-[#0B0C10] border-b border-gray-800 z-50">
        <button onClick={() => setScreen(Screen.HOME)} className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
             <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">BALANCE</span>
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
         
         {/* Background Subtle Texture */}
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
             
             {/* Rule Badge */}
             <div className="absolute -top-6 left-0 w-full flex justify-center">
                 <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                     <AlertTriangle size={10} /> #1 IS HOUSE (AUTO LOSS)
                 </div>
             </div>

             {/* The Grid */}
             <div className="grid grid-cols-3 grid-rows-2 gap-2 bg-black border-4 border-black aspect-[4/3]">
                 {[1, 2, 3, 4, 5, 6].map((num) => {
                     const isSelected = selectedNumbers.includes(num);
                     const isWinningNum = gameState === 'RESULT' && diceValue === num;

                     return (
                        <button
                            key={num}
                            onClick={() => handleNumberToggle(num)}
                            disabled={gameState === 'ROLLING' || gameState === 'RESULT'}
                            className={`
                                relative flex items-center justify-center transition-all duration-100
                                ${isSelected ? 'bg-black text-white' : 'bg-[#E8DCC4] hover:bg-[#D8CCB4] text-black'}
                                ${isWinningNum ? '!bg-gold !text-black animate-pulse' : ''}
                            `}
                        >
                            <span className="font-sans font-bold text-6xl md:text-7xl leading-none select-none">
                                {num}
                            </span>
                            
                            {/* Selected Indicator (Chip) */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-neon border-2 border-white animate-fade-in shadow-md flex items-center justify-center">
                                    <div className="w-2 h-2 bg-black rounded-full"></div>
                                </div>
                            )}
                        </button>
                     );
                 })}
             </div>
         </div>
         
         <p className="mt-2 text-xs text-gray-500 font-mono tracking-widest uppercase text-center">
             {gameState === 'ROLLING' ? 'ROLLING...' : gameState === 'RESULT' ? 'GAME OVER' : 'SELECT ONE OR MORE NUMBERS'}
         </p>

      </div>

      {/* 3. CONTROL PANEL */}
      <div className="shrink-0 bg-[#0B0C10] border-t border-gray-800 p-4 pb-safe z-50">
          <div className="max-w-md mx-auto flex flex-col gap-4">
              
              <div className="flex gap-4 items-stretch">
                  {/* Bet Per Number */}
                  <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold ml-1">Bet Per Number</span>
                      <div className="flex items-center gap-1 bg-[#151a21] border border-gray-700 rounded-lg h-12 p-1">
                            <button onClick={() => handleBetChange(-100)} disabled={gameState !== 'IDLE'} className="w-10 h-full bg-[#0B0C10] rounded border border-gray-800 flex items-center justify-center text-white hover:border-neon transition-colors disabled:opacity-50"><Minus size={16}/></button>
                            <input 
                                type="number" 
                                value={betPerNumber} 
                                onChange={handleBetInputChange}
                                onBlur={handleBetInputBlur}
                                disabled={gameState !== 'IDLE'}
                                className="flex-1 bg-transparent text-center font-digital text-2xl font-bold text-white outline-none min-w-0 disabled:text-gray-500"
                            />
                            <button onClick={() => handleBetChange(100)} disabled={gameState !== 'IDLE'} className="w-10 h-full bg-[#0B0C10] rounded border border-gray-800 flex items-center justify-center text-white hover:border-neon transition-colors disabled:opacity-50"><Plus size={16}/></button>
                      </div>
                  </div>

                  {/* Total Wager Display */}
                  <div className="flex flex-col gap-1 w-1/3">
                      <span className="text-[9px] text-gray-500 uppercase font-bold ml-1 text-right">Total Bet</span>
                      <div className="bg-black/40 border border-gray-800 rounded-lg h-12 flex items-center justify-end px-3">
                          <span className={`font-digital font-bold text-xl ${selectedNumbers.length > 0 ? 'text-neon' : 'text-gray-600'}`}>
                             {totalBet > 0 ? totalBet.toLocaleString() : '0'}
                          </span>
                      </div>
                  </div>
              </div>

              {/* Action Button */}
              {gameState === 'RESULT' ? (
                  <NeonButton 
                        fullWidth 
                        variant="secondary" 
                        onClick={handleReset} 
                        className="h-14 text-xl tracking-widest font-black"
                    >
                        <RefreshCw size={24} className="mr-2" /> TRY AGAIN
                  </NeonButton>
              ) : (
                  <NeonButton 
                        fullWidth 
                        variant="primary" 
                        onClick={handleRoll} 
                        disabled={gameState === 'ROLLING'}
                        className="h-14 text-xl tracking-widest font-black"
                    >
                        {gameState === 'ROLLING' ? 'ROLLING...' : `START GAME`}
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
                <h3 className="text-white font-title text-xl mb-2">Insufficient Funds</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Total bet is <span className="text-white font-bold">{totalBet.toLocaleString()} CFA</span>.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setShowLowBalanceModal(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <NeonButton variant="primary" className="flex-1" onClick={() => setScreen(Screen.WALLET)}>DEPOSIT</NeonButton>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DiceTableScreen;
