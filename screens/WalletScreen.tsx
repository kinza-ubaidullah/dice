
import React, { useState } from 'react';
import { User, Screen, Transaction } from '../types';
import NeonButton from '../components/NeonButton';
import { audioManager } from '../utils/audio';
import { 
    ArrowDown, ArrowUp, 
    Smartphone, CreditCard, X, ChevronLeft,
    Loader2, Check, AlertTriangle, ChevronRight, Globe, Landmark 
} from 'lucide-react';

interface WalletScreenProps {
  user: User;
  setScreen: (screen: Screen) => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  returnScreen?: Screen;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ user, setScreen, setUser, transactions, addTransaction, returnScreen }) => {
  const [view, setView] = useState<'MAIN' | 'DEPOSIT_METHODS' | 'WITHDRAW_METHODS'>('MAIN');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingState, setProcessingState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  
  // Validation States
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forms
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const depositMethods = [
    { id: 'VISA', name: 'Visa Card', icon: <CreditCard size={24} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'MASTERCARD', name: 'Mastercard', icon: <Globe size={24} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { id: 'MTN', name: 'MTN Mobile Money', icon: <Smartphone size={24} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { id: 'MOOV', name: 'Moov Money', icon: <Smartphone size={24} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  ];

  const withdrawMethods = [
    { id: 'BANK', name: 'Bank Transfer', icon: <Landmark size={24} />, color: 'text-gray-200', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
    { id: 'MTN', name: 'MTN Mobile Money', icon: <Smartphone size={24} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { id: 'MOOV', name: 'Moov Money', icon: <Smartphone size={24} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  ];

  const quickAmounts = [1000, 2000, 5000, 10000];

  const handleBack = () => {
    if (view !== 'MAIN') {
        setView('MAIN');
    } else {
        // Return to previous screen (e.g., Game or DiceTable) if available
        if (returnScreen) {
            setScreen(returnScreen);
        } else {
            setScreen(Screen.HOME);
        }
    }
  };

  const handleSelectMethod = (methodId: string) => {
      audioManager.play('CLICK');
      setErrorMsg(null);
      setSelectedMethodId(methodId);
      setCardName(''); setCardNumber(''); setExpiry(''); setCvc(''); setMobileNumber('');
      
      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
          alert("Please enter a valid amount.");
          return;
      }

      // WITHDRAWAL RULES CHECK
      if (view === 'WITHDRAW_METHODS') {
          // Rule 1: Min Amount 1000
          if (numAmount < 1000) {
              alert("Minimum withdrawal amount is 1,000 CFA.");
              return;
          }
          // Rule 2: Insufficient Funds
          if (user.wallet.balance < numAmount) {
              alert("Insufficient funds.");
              return;
          }
          // Rule 3: Frequency Limit (3x Week)
          if (user.withdrawalLimits.countThisWeek >= 3) {
              alert("Weekly withdrawal limit reached (3/3). Please try again next week.");
              return;
          }
      }

      setShowPaymentModal(true);
      setProcessingState('IDLE');
  };

  const processTransaction = () => {
      setProcessingState('PROCESSING');
      const isDeposit = view === 'DEPOSIT_METHODS';
      const numAmount = Number(amount);

      // Simulate API Response Time
      setTimeout(() => {
          const newTx: Transaction = {
              id: Date.now().toString(),
              userId: user.id, // Tag with user ID
              userName: user.name, // Tag with user Name
              type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
              amount: numAmount,
              date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
              status: 'SUCCESS',
              method: (isDeposit ? depositMethods : withdrawMethods).find(m => m.id === selectedMethodId)?.name || 'Unknown',
              accountNumber: selectedMethodId === 'VISA' || selectedMethodId === 'MASTERCARD' ? `**** ${cardNumber.slice(-4)}` : mobileNumber
          };

          // 1. Add Record to History
          addTransaction(newTx);

          // 2. CRITICAL: Update User Balance State
          // This ensures the GameScreen sees the new balance immediately.
          if (newTx.status === 'SUCCESS') {
              setUser(prevUser => {
                  const currentWallet = prevUser.wallet || { balance: 0, totalDeposited: 0, totalWithdrawn: 0 };
                  return {
                      ...prevUser,
                      wallet: {
                          ...currentWallet,
                          balance: isDeposit 
                              ? currentWallet.balance + numAmount 
                              : currentWallet.balance - numAmount,
                          totalDeposited: isDeposit 
                              ? currentWallet.totalDeposited + numAmount 
                              : currentWallet.totalDeposited,
                          totalWithdrawn: !isDeposit 
                              ? currentWallet.totalWithdrawn + numAmount 
                              : currentWallet.totalWithdrawn
                      }
                  };
              });
          }

          setProcessingState('SUCCESS');
          audioManager.play('SUCCESS');
      }, 2000);
  };

  const resetAll = () => {
      setShowPaymentModal(false);
      setView('MAIN');
      setAmount('');
      setSelectedMethodId(null);
      setProcessingState('IDLE');
  };

  const isDepositView = view === 'DEPOSIT_METHODS';
  const activeMethods = isDepositView ? depositMethods : withdrawMethods;
  const selectedMethod = (isDepositView ? depositMethods : withdrawMethods).find(m => m.id === selectedMethodId);
  const isCardMethod = selectedMethodId === 'VISA' || selectedMethodId === 'MASTERCARD';

  return (
    <div className="flex flex-col min-h-full bg-background pb-20 relative">
        {/* Header with Back Button */}
        <div className="p-4 bg-panel border-b border-gray-800 sticky top-0 z-20 flex items-center shadow-md">
            <button onClick={handleBack} className="mr-4 text-textMuted hover:text-white transition-colors">
                <ChevronLeft size={24} />
            </button>
            <h1 className="font-title text-white text-lg tracking-wider">
                {view === 'MAIN' ? 'MY WALLET' : isDepositView ? 'DEPOSIT FUNDS' : 'WITHDRAW FUNDS'}
            </h1>
        </div>

        <div className="p-6">
            
            {view === 'MAIN' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-br from-[#1F2833] to-black p-6 rounded-3xl relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-gray-800">
                            <div className="relative z-10 flex flex-col items-center py-4">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2">Available Balance</span>
                                <h2 className="text-5xl font-digital text-white font-black tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {user.wallet.balance.toLocaleString()} <span className="text-2xl text-gray-500">CFA</span>
                                </h2>
                            </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                        <AlertTriangle className="text-blue-400" size={20} />
                        <div>
                            <p className="text-[10px] text-blue-300 font-bold uppercase">Withdrawal Limit</p>
                            <p className="text-xs text-gray-400">Min 1,000 CFA • Max 3x per week ({user.withdrawalLimits.countThisWeek}/3 used)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setView('DEPOSIT_METHODS')} className="group relative overflow-hidden bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3">
                            <div className="p-3 bg-green-500 rounded-full text-black shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform"><ArrowDown size={28} strokeWidth={3} /></div>
                            <div><h3 className="font-title text-green-400 text-lg">DEPOSIT</h3></div>
                        </button>

                        <button onClick={() => setView('WITHDRAW_METHODS')} className="group relative overflow-hidden bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3">
                            <div className="p-3 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform"><ArrowUp size={28} strokeWidth={3} /></div>
                            <div><h3 className="font-title text-red-400 text-lg">WITHDRAW</h3></div>
                        </button>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4 mt-4">
                            <h3 className="font-title text-white italic text-lg">RECENT HISTORY</h3>
                        </div>
                        <div className="space-y-3">
                            {transactions.slice(0, 3).map((tx) => (
                                <div key={tx.id} className="bg-[#151a21] border border-gray-800 rounded-xl p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {tx.type === 'DEPOSIT' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase">{tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</p>
                                            <p className="text-[10px] text-gray-500">{tx.date}</p>
                                        </div>
                                    </div>
                                    <span className={`font-digital text-lg font-bold ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-white'}`}>
                                        {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {transactions.length === 0 && <div className="text-center py-8 text-gray-600 text-xs uppercase tracking-widest">No Transactions Yet</div>}
                        </div>
                    </div>
                </div>
            )}

            {(view === 'DEPOSIT_METHODS' || view === 'WITHDRAW_METHODS') && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-[#151a21] p-6 rounded-2xl border border-gray-700">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Amount (CFA)</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={isDepositView ? "Min 100" : "Min 1000"}
                            className="w-full bg-black/40 border border-gray-600 rounded-xl py-4 px-4 text-white font-digital text-3xl focus:border-neon focus:outline-none"
                        />
                        <div className="flex gap-2 flex-wrap mt-3">
                            {quickAmounts.map(amt => (
                                <button 
                                    key={amt} 
                                    onClick={() => { audioManager.play('CLICK'); setAmount(amt.toString()); }} 
                                    className="px-3 py-2 rounded-lg bg-gray-800 text-xs font-bold text-gray-300 hover:bg-neon hover:text-black transition-colors"
                                >
                                    +{amt.toLocaleString()}
                                </button>
                            ))}
                        </div>
                        {!isDepositView && (
                             <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1"><AlertTriangle size={10}/> Minimum withdrawal is 1,000 CFA</p>
                        )}
                    </div>

                    <div className="grid gap-3">
                        {activeMethods.map((method) => (
                            <button key={method.id} onClick={() => handleSelectMethod(method.id)} className={`w-full p-4 rounded-xl border flex items-center justify-between group transition-all ${method.bg} ${method.border} hover:brightness-125`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/20 ${method.color}`}>{method.icon}</div>
                                    <div className="text-left">
                                        <h4 className={`font-bold text-sm ${method.color}`}>{method.name}</h4>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Instant</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-500 group-hover:text-white" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => processingState !== 'PROCESSING' && setShowPaymentModal(false)}></div>
                <div className="relative w-full max-w-md bg-[#101216] rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in-up">
                    {processingState === 'SUCCESS' ? (
                            <div className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 animate-bounce-small">
                                    <Check size={48} className="text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-title text-white mb-2">Success!</h3>
                                    <p className="text-gray-400 text-sm">Transaction completed.</p>
                                    <p className="text-neon font-digital text-xl mt-2">New Balance: {(isDepositView ? user.wallet.balance + Number(amount) : user.wallet.balance - Number(amount)).toLocaleString()} CFA</p>
                                </div>
                                <NeonButton fullWidth onClick={resetAll}>DONE</NeonButton>
                            </div>
                    ) : (
                        <div className="p-6 space-y-4">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white text-lg">Confirm {isDepositView ? 'Deposit' : 'Withdrawal'}</h3>
                                {processingState === 'IDLE' && <button onClick={() => setShowPaymentModal(false)}><X className="text-gray-500 hover:text-white"/></button>}
                            </div>
                            
                            <div className="p-4 bg-black/40 rounded-xl border border-gray-800 text-center">
                                <p className="text-gray-500 text-xs uppercase mb-1">Total Amount</p>
                                <p className="text-2xl font-digital text-white font-bold">{Number(amount).toLocaleString()} CFA</p>
                            </div>

                            {isCardMethod ? (
                                <div className="space-y-3">
                                    <input placeholder="Card Name" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-white"/>
                                    <input placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-white"/>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-white"/>
                                        <input placeholder="CVC" value={cvc} onChange={e => setCvc(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-white"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-white"/>
                                </div>
                            )}

                            <NeonButton fullWidth onClick={processTransaction} disabled={processingState === 'PROCESSING'} variant={isDepositView ? 'primary' : 'danger'}>
                                {processingState === 'PROCESSING' ? <span className="flex gap-2"><Loader2 className="animate-spin"/> Processing...</span> : 'CONFIRM'}
                            </NeonButton>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default WalletScreen;
