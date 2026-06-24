
export interface GamePackage {
  id: string;
  amount: number;
  label: string;
  price: number;
  bonus?: string;
  type?: 'Standard' | 'Weekly' | 'Monthly';
}

export interface Game {
  id: string;
  name: string;
  category: 'Top Up' | 'Gift Card' | 'Subscription';
  image: string;
  badge?: string;
  packages: GamePackage[];
  createdAt?: string;
  isSlider?: boolean;
  isFeatured?: boolean;
}

export interface Order {
  id: string;
  gameId: string;
  gameName: string;
  packageName: string;
  price: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Payment Done';
  date: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  trxId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  joinDate: string;
  avatar?: string;
  totalSpent: number;
  orderCount: number;
  walletBalance: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  role: 'SuperAdmin' | 'Staff';
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  role: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
}

export interface AdminSettings {
  sliderGameIds: string[];
  featuredGameIds?: string[];
}

export interface WalletTopUp {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  platform: string; // bKash, Nagad, Upay
  transactionId: string; // This will hold either Sender Number or Transaction ID
  status: 'Pending' | 'Completed' | 'Failed';
  date: string;
}

export interface BalanceAdjustment {
  id: string;
  adminName: string;
  adminEmail: string;
  userEmail: string;
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
  date: string;
}
