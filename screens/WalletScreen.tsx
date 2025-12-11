
import React, { useState } from 'react';
import { User, Screen, Transaction } from '../types';
import NeonButton from '../components/NeonButton';
import { audioManager } from '../utils/audio';
import { 
    ArrowDown, ArrowUp, 
    Smartphone, CreditCard, X, ChevronRight, ShieldCheck, 
    Loader2, Check, Landmark, Globe 
} from 'lucide-react';

interface WalletScreenProps {
  user: User;
  setScreen: (screen: Screen) => void;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ user, setScreen, setUser, transactions, addTransaction }) => {
  // Navigation State
  const [view, setView] = useState<'MAIN' | 'DEPOSIT_METHODS' | 'WITHDRAW_METHODS'>('MAIN');
  
  // Transaction State
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  
  // Modal State (The "Pop-up")
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingState, setProcessingState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');

  // Banking Details Form State
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

  // --- LOGIC HANDLERS ---

  const handleSelectMethod = (methodId: string) => {
      setSelectedMethodId(methodId);
      // Reset form fields
      setCardName('');
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setMobileNumber('');
      
      // Open the Banking Details Pop-up
      setShowPaymentModal(true);
      setProcessingState('IDLE');
  };

  const processTransaction = () => {
      const numAmount = Number(amount);

      // Validation
      if (!numAmount || numAmount <= 0) {
          alert("Please enter a valid amount before proceeding.");
          return;
      }

      const isDeposit = view === 'DEPOSIT_METHODS';

      if (!isDeposit && user.balance < numAmount) {
          alert("Insufficient funds for withdrawal.");
          return;
      }

      // Validate Banking Details based on method
      if (selectedMethodId === 'VISA' || selectedMethodId === 'MASTERCARD') {
          if (!cardNumber || !expiry || !cvc || !cardName) {
              alert("Please fill in all card details.");
              return;
          }
      } else {
          if (!mobileNumber || mobileNumber.length < 8) {
              alert("Please enter a valid mobile number.");
              return;
          }
      }

      setProcessingState('PROCESSING');

      // Simulate API Call
      setTimeout(() => {
          const newTx: Transaction = {
              id: Date.now().toString(),
              type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
              amount: numAmount,
              date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
              status: 'SUCCESS',
              method: (isDeposit ? depositMethods : withdrawMethods).find(m => m.id === selectedMethodId)?.name || 'Unknown',
              accountNumber: selectedMethodId === 'VISA' || selectedMethodId === 'MASTERCARD' ? `**** ${cardNumber.slice(-4)}` : mobileNumber
          };

          addTransaction(newTx);
          
          if (isDeposit) {
              setUser(prev => ({ ...prev, balance: prev.balance + numAmount }));
              audioManager.play('WIN');
          } else {
              setUser(prev => ({ ...prev, balance: prev.balance - numAmount }));
              audioManager.play('CLICK');
          }

          setProcessingState('SUCCESS');
      }, 3000);
  };

  const resetAll = () => {
      setShowPaymentModal(false);
      setView('MAIN');
      setAmount('');
      setSelectedMethodId(null);
      setProcessingState('IDLE');
  };

  // --- HELPER VARIABLES FOR RENDER ---
  const isDepositView = view === 'DEPOSIT_METHODS';
  const isWithdrawView = view === 'WITHDRAW_METHODS';
  const activeMethods = isDepositView ? depositMethods : withdrawMethods;
  
  const isModalDeposit = view === 'DEPOSIT_METHODS';
  const selectedMethod = isModalDeposit 
    ? depositMethods.find(m => m.id === selectedMethodId) 
    : withdrawMethods.find(m => m.id === selectedMethodId);
  const isCardMethod = selectedMethodId === 'VISA' || selectedMethodId === 'MASTERCARD';

  return (
    <div className="flex flex-col min-h-full bg-background pb-20 relative">
        <div className="p-6">
            <h1 className="font-title text-2xl text-white mb-6">MY WALLET</h1>
            
            {/* MAIN VIEW */}
            {view === 'MAIN' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-[#1F2833] to-black p-6 rounded-3xl relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-gray-800">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col items-center py-4">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2">Available Balance</span>
                                <h2 className="text-5xl font-digital text-white font-black tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    {user.balance.toLocaleString()} <span className="text-2xl text-gray-500">CFA</span>
                                </h2>
                            </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setView('DEPOSIT_METHODS')}
                            className="group relative overflow-hidden bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500 p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3"
                        >
                            <div className="p-3 bg-green-500 rounded-full text-black shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                                <ArrowDown size={28} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="font-title text-green-400 text-lg">DEPOSIT</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Add Funds</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => setView('WITHDRAW_METHODS')}
                            className="group relative overflow-hidden bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500 p-6 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3"
                        >
                            <div className="p-3 bg-red-500 rounded-full text-white shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                                <ArrowUp size={28} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="font-title text-red-400 text-lg">WITHDRAW</h3>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Cash Out</p>
                            </div>
                        </button>
                    </div>

                    {/* Recent Transactions Preview */}
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
                                {transactions.length === 0 && (
                                    <div className="text-center py-8 text-gray-600 text-xs uppercase tracking-widest">No Transactions Yet</div>
                                )}
                            </div>
                    </div>
                </div>
            )}

            {/* SELECTION VIEW (DEPOSIT OR WITHDRAW) */}
            {(view === 'DEPOSIT_METHODS' || view === 'WITHDRAW_METHODS') && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => setView('MAIN')} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white"><ChevronRight className="rotate-180" size={20}/></button>
                        <h2 className={`font-title text-2xl ${isDepositView ? 'text-green-400' : 'text-red-400'}`}>
                            {isDepositView ? 'SELECT DEPOSIT METHOD' : 'SELECT WITHDRAWAL METHOD'}
                        </h2>
                    </div>

                    {/* Amount Input Section */}
                    <div className="bg-[#151a21] p-6 rounded-2xl border border-gray-700">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                            {isDepositView ? 'Amount to Deposit' : 'Amount to Withdraw'}
                        </label>
                        <div className="relative mb-4">
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-black/40 border border-gray-600 rounded-xl py-4 pl-4 pr-16 text-white font-digital text-3xl focus:border-neon focus:outline-none transition-colors"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">CFA</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                                {quickAmounts.map(amt => (
                                    <button 
                                        key={amt} 
                                        onClick={() => setAmount(amt.toString())}
                                        className="px-3 py-2 rounded-lg bg-gray-800 text-xs font-bold text-gray-300 hover:bg-neon hover:text-black transition-colors"
                                    >
                                        +{amt.toLocaleString()}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Methods Grid */}
                    <div className="grid gap-3">
                        {activeMethods.map((method) => (
                            <button 
                                key={method.id}
                                onClick={() => handleSelectMethod(method.id)}
                                className={`w-full p-4 rounded-xl border flex items-center justify-between group transition-all ${method.bg} ${method.border} hover:brightness-125`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/20 ${method.color}`}>
                                        {method.icon}
                                    </div>
                                    <div className="text-left">
                                        <h4 className={`font-bold text-sm ${method.color}`}>{method.name}</h4>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                                            {isDepositView ? 'Instant Processing' : '2-5 Mins Transfer'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-500 group-hover:text-white" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        
        {/* PAYMENT MODAL (POP-UP) */}
        {showPaymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => processingState !== 'PROCESSING' && setShowPaymentModal(false)}></div>
                
                <div className="relative w-full max-w-md bg-[#101216] rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
                    
                    {processingState === 'SUCCESS' ? (
                            <div className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 animate-bounce-small">
                                    <Check size={48} className="text-green-500" strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-title text-white mb-2">Successful!</h3>
                                    <p className="text-gray-400 text-sm">
                                        {isModalDeposit 
                                            ? `Funds have been added to your wallet.` 
                                            : `Withdrawal request sent to ${selectedMethod?.name}.`
                                        }
                                    </p>
                                </div>
                                <NeonButton fullWidth onClick={resetAll}>DONE</NeonButton>
                            </div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-gray-800 bg-[#151a21] flex justify-between items-center sticky top-0 z-10">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-green-500" />
                                    {isModalDeposit ? 'Secure Payment' : 'Beneficiary Details'}
                                </h3>
                                {!processingState.includes('PROCESSING') && (
                                    <button onClick={() => setShowPaymentModal(false)}><X className="text-gray-500 hover:text-white"/></button>
                                )}
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Summary */}
                                <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        {selectedMethod?.icon}
                                        <span className="text-sm font-bold text-gray-300">{selectedMethod?.name}</span>
                                    </div>
                                    <span className={`font-digital text-xl font-bold ${isModalDeposit ? 'text-green-400' : 'text-red-400'}`}>
                                        {Number(amount).toLocaleString()} CFA
                                    </span>
                                </div>

                                <p className="text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                                    Instructions: Please ensure all digits are entered correctly. Click outside or use the X to cancel.
                                </p>

                                {/* Banking Forms */}
                                {isCardMethod ? (
                                    <div className="space-y-4">
                                        {/* Credit Card Form */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Cardholder Name</label>
                                            <input 
                                                value={cardName} onChange={e => setCardName(e.target.value)}
                                                placeholder="JON DOE"
                                                className="w-full bg-[#0B0C10] border border-gray-700 rounded-lg p-3 text-white focus:border-neon outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Card Number</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                <input 
                                                    value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                                                    placeholder="0000 0000 0000 0000"
                                                    maxLength={19}
                                                    className="w-full bg-[#0B0C10] border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:border-neon outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Expiry Date</label>
                                                <input 
                                                    value={expiry} onChange={e => setExpiry(e.target.value)}
                                                    placeholder="MM/YY"
                                                    maxLength={5}
                                                    className="w-full bg-[#0B0C10] border border-gray-700 rounded-lg p-3 text-white focus:border-neon outline-none text-center"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">CVC / CVV</label>
                                                <input 
                                                    value={cvc} onChange={e => setCvc(e.target.value)}
                                                    placeholder="123"
                                                    maxLength={3}
                                                    type="password"
                                                    className="w-full bg-[#0B0C10] border border-gray-700 rounded-lg p-3 text-white focus:border-neon outline-none text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Mobile Money Form */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">
                                                {isModalDeposit ? 'Enter Your Mobile Number' : 'Beneficiary Mobile Number'}
                                            </label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                <input 
                                                    value={mobileNumber} onChange={e => setMobileNumber(e.target.value)}
                                                    placeholder="e.g. 66001122"
                                                    type="tel"
                                                    className="w-full bg-[#0B0C10] border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:border-neon outline-none font-mono"
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500">
                                                {isModalDeposit 
                                                    ? "You will receive a USSD prompt on this number to approve the transaction." 
                                                    : "Funds will be transferred to this mobile wallet instantly."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <NeonButton 
                                    fullWidth 
                                    onClick={processTransaction} 
                                    disabled={processingState === 'PROCESSING'}
                                    variant={isModalDeposit ? 'primary' : 'danger'}
                                    className="mt-4"
                                >
                                    {processingState === 'PROCESSING' ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" /> Processing...
                                        </span>
                                    ) : (
                                        isModalDeposit ? 'PAY NOW' : 'CONFIRM WITHDRAWAL'
                                    )}
                                </NeonButton>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default WalletScreen;
