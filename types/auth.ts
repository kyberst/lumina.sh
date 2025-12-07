/** Represents an authenticated user in the local system. */
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string; 
  credits: number;
  twoFactorEnabled: boolean;
  createdAt: number;
}

/** Represents a active login session. */
export interface Session {
  id: string;
  userId: string;
  device: string;
  ip: string;
  lastActive: number;
  isCurrent?: boolean;
}

/** Represents a transaction or usage history. */
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  credits: number;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  description: string;
  timestamp: number;
}