export type UserRole = 'user' | 'admin'
export type OrderStatus = 'pending' | 'completed' | 'refunded' | 'failed'
export type TransactionType = 'topup' | 'purchase' | 'refund'
export type TransactionStatus = 'pending' | 'success' | 'failed'
export type DeliveryType = 'instant' | 'manual'
export type Gateway = 'flutterwave' | 'paypal' | 'crypto' | 'bank'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  wallet_balance: number
  is_banned: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Service {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  category?: Category
}

export interface Listing {
  id: string
  service_id: string
  country_code: string
  country_name: string
  price: number
  stock: number
  is_active: boolean
  delivery_type: DeliveryType
  notes: string | null
  created_at: string
  updated_at: string
  service?: Service
}

export interface ListingItem {
  id: string
  listing_id: string
  content: string
  is_sold: boolean
  sold_at: string | null
  order_id: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  listing_id: string | null
  listing_item_id: string | null
  amount: number
  status: OrderStatus
  country_code: string | null
  country_name: string | null
  service_name: string | null
  category_name: string | null
  delivered_content: string | null
  created_at: string
  updated_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  reference: string | null
  gateway: Gateway | null
  status: TransactionStatus
  metadata: Record<string, unknown>
  order_id: string | null
  created_at: string
}

export interface SiteSetting {
  key: string
  value: string | null
  updated_at: string
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Store display types
export interface ListingWithService extends Listing {
  service: Service & { category: Category }
}
