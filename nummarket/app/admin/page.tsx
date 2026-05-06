import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, ShoppingBag, Package, DollarSign, ArrowRight, TrendingUp } from 'lucide-react'

export const metadata = { title: 'Admin Overview' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [usersRes, ordersRes, listingsRes, revenueRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'user'),
    supabase.from('orders').select('id, amount, status, created_at, service_name, country_name').order('created_at', { ascending: false }).limit(10),
    supabase.from('listings').select('id', { count: 'exact' }).eq('is_active', true).gt('stock', 0),
    supabase.from('orders').select('amount').eq('status', 'completed'),
  ])

  const totalUsers = usersRes.count || 0
  const recentOrders = ordersRes.data || []
  const activeListings = listingsRes.count || 0
  const totalRevenue = (revenueRes.data || []).reduce((s: number, o: { amount: number }) => s + o.amount, 0)
  const todayOrders = recentOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length

  const stats = [
    { label: 'Total users', value: totalUsers.toLocaleString(), icon: <Users size={18} className="text-blue-400" />, href: '/admin/users', bg: 'bg-blue-600/15' },
    { label: 'Active listings', value: activeListings.toLocaleString(), icon: <Package size={18} className="text-violet-400" />, href: '/admin/listings', bg: 'bg-violet-600/15' },
    { label: 'Total revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={18} className="text-green-400" />, href: '/admin/orders', bg: 'bg-green-600/15' },
    { label: "Today's orders", value: todayOrders.toLocaleString(), icon: <TrendingUp size={18} className="text-amber-400" />, href: '/admin/orders', bg: 'bg-amber-600/15' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-zinc-500 text-sm mt-1">JOSIXLOGS platform at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-5 hover:border-violet-500/30 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg}`}>{stat.icon}</div>
              <ArrowRight size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>
            <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Add listing', href: '/admin/listings/new', color: 'bg-violet-600 hover:bg-violet-500' },
          { label: 'Add category', href: '/admin/categories', color: 'bg-white/5 hover:bg-white/10' },
          { label: 'View orders', href: '/admin/orders', color: 'bg-white/5 hover:bg-white/10' },
          { label: 'Manage users', href: '/admin/users', color: 'bg-white/5 hover:bg-white/10' },
        ].map((action) => (
          <Link key={action.label} href={action.href} className={`${action.color} text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors text-center`}>
            {action.label}
          </Link>
        ))}
      </div>

      {/* Recent orders table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[#1e1e2a] flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-sm">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">View all <ArrowRight size={11} /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a24]">
                {['Order ID', 'Service', 'Country', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-zinc-600 text-xs">No orders yet</td></tr>
              ) : recentOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3 text-xs font-mono text-zinc-500">#{order.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-xs text-white font-medium">{order.service_name || '—'}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{order.country_name || '—'}</td>
                  <td className="px-5 py-3 text-xs font-bold text-white">${order.amount.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                      order.status === 'refunded' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
