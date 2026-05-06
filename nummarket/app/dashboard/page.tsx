import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ShoppingBag, Wallet, ArrowRight, TrendingUp } from 'lucide-react'
import { Order, WalletTransaction } from '@/lib/types'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, ordersRes, txRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('orders').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('wallet_transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
  ])

  const profile = profileRes.data
  const orders: Order[] = ordersRes.data || []
  const transactions: WalletTransaction[] = txRes.data || []

  const totalSpent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.amount, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">
          Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Here's your account overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Wallet balance', value: `$${profile?.wallet_balance?.toFixed(2) || '0.00'}`, icon: <Wallet size={18} className="text-violet-400" />, href: '/dashboard/wallet', color: 'violet' },
          { label: 'Total orders', value: orders.length.toString(), icon: <ShoppingBag size={18} className="text-blue-400" />, href: '/dashboard/orders', color: 'blue' },
          { label: 'Total spent', value: `$${totalSpent.toFixed(2)}`, icon: <TrendingUp size={18} className="text-green-400" />, href: '/dashboard/orders', color: 'green' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-5 hover:border-violet-500/30 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${stat.color}-600/15`}>
                {stat.icon}
              </div>
              <ArrowRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-sm">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No orders yet</p>
              <Link href="/store" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">Browse store →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-[#1a1a24] last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white">{order.service_name || 'Order'}</p>
                    <p className="text-[10px] text-zinc-500">{order.country_name} · {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">${order.amount.toFixed(2)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-500/15 text-green-400' : order.status === 'refunded' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet activity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-sm">Wallet activity</h2>
            <Link href="/dashboard/wallet" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-600">No transactions yet</p>
              <Link href="/dashboard/wallet" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">Top up wallet →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#1a1a24] last:border-0">
                  <div>
                    <p className="text-xs font-medium text-white capitalize">{tx.type}</p>
                    <p className="text-[10px] text-zinc-500">{tx.gateway || 'wallet'} · {new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-zinc-600">bal: ${tx.balance_after.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick topup CTA */}
      {profile && profile.wallet_balance < 5 && (
        <div className="mt-6 card p-5 border-violet-500/20 bg-violet-600/5 flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-white text-sm">Low wallet balance</p>
            <p className="text-xs text-zinc-500 mt-0.5">Top up to keep purchasing without interruption.</p>
          </div>
          <Link href="/dashboard/wallet" className="flex-shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors">
            Top up now
          </Link>
        </div>
      )}
    </div>
  )
}
