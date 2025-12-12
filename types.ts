
export enum Screen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  HOME = 'HOME', // Lobby
  GAME = 'GAME',
  WALLET = 'WALLET',
  PROFILE = 'PROFILE',
  HISTORY = 'HISTORY', // Game Log
  ADMIN = 'ADMIN',
  DICE_TABLE = 'DICE_TABLE', // New Game Mode
}

export interface UserWallet {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

export interface User {
  id: string; // Mapped from API 'uid'
  name: string; // Mapped from API 'displayName'
  email: string; // Required now
  phone?: string; // Optional now
  password?: string; // Optional (not stored locally if using API)
  
  // New Explicit Wallet Structure
  wallet: UserWallet;

  avatarUrl: string;
  role?: 'user' | 'admin' | 'USER' | 'ADMIN'; // API uses lowercase 'user', app uses uppercase
  isBlocked?: boolean;
  
  // New Stats & Limits
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalWagered: number;
    totalWon: number;
  };
  withdrawalLimits: {
    countThisWeek: number;
    lastWithdrawalDate: string; // ISO String
  };
}

export interface GameRecord {
  id: string;
  date: string;
  betAmount: number;
  userScore: number;
  opponentScore: number;
  result: 'WIN' | 'LOSS' | 'DRAW';
}

export interface Transaction {
  id: string;
  userId: string; // Added for Admin Tracking
  userName: string; // Added for Admin Tracking
  type: 'DEPOSIT' | 'WITHDRAW' | 'GAME_WIN' | 'GAME_BET' | 'GAME_REFUND' | 'ADMIN_ADJUSTMENT';
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  method: string;
  accountNumber?: string;
  adminNote?: string;
}

export type Operator = 'MTN' | 'MOOV' | 'CELTIS';

export interface DiceProps {
  value: number;
  isRolling: boolean;
  color?: 'neon' | 'gold' | 'danger';
}
