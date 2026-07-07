export interface User {
  userId: string;
  email: string;
  name: string;
  balance: number;
  acctNumber: string;
  acctBank: string;
  joined: string;
}

export interface Order {
  id: string;
  userId: string;
  service: string;
  serviceIcon: string;
  number: string;
  country: string;
  price: number;
  date: string;
  fivesimOrderId?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  desc: string;
  amount: number;
  date: string;
}

export interface LogItem {
  id: string;
  platform: string;
  domain: string;
  label: string;
  description: string;
  price: number;
  sold: boolean;
}

export interface CountryPrice {
  country: string;
  countryCode: string;
  price: number;
  available: number;
}
