
export enum Screen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  HOME = 'HOME', // Lobby
  GAME = 'GAME',
  WALLET = 'WALLET',
  PROFILE = 'PROFILE',
  HISTORY = 'HISTORY', // Game Log
  ADMIN = 'ADMIN',
}

export interface User {
  id: string; // Added for persistence
  name: string;
  email?: string;
  phone?: string;
  password?: string; // Added for mock auth
  balance: number;
  avatarUrl: string;
  role?: 'USER' | 'ADMIN';
  isBlocked?: boolean;
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
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  method: string;
  accountNumber?: string;
}

export type Operator = 'MTN' | 'MOOV' | 'CELTIS';

export interface DiceProps {
  value: number;
  isRolling: boolean;
  color?: 'neon' | 'gold' | 'danger';
}
