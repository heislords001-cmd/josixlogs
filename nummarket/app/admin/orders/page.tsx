'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, RefreshCw, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*, profile:profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (statusFilter) query = query.eq('status', statusFilter)
    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) { toast.error('Update failed'); return }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o))
    toast.success(`Order marked as ${status}`)
  }

  const filtered = orders.filter((o) =>
    !search ||
    o.id.includes(search) ||
    o.service_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.profile?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s: string) => ({
    completed: 'bg-green-500/15 text-green-400',
    pending: 'bg-amber-500/15 text-amber-400',
    refunded: 'bg-blue-500/15 text-blue-400',
    failed: 'bg-red-500/15 text-red-400',
  }[s] || 'bg-white/5 text-zinc-400')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
          <p className="text-zinc-500 text-sm mt-1">{orders.length} orders</p>
        </div>
        <button onClick={fetchOrders} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID, service or email..." className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-zinc-400 focus:outline-none focus:border-violet-500/60">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2a]">
                {['Order', 'User', 'Service', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-zinc-600">No orders found</td></tr>
              ) : filtered.map((order) => (
                <>
                  <tr key={order.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-zinc-500">#{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400 max-w-[150px] truncate">{order.profile?.email || '—'}</td>
                    <td className="px-4 py-3 text-xs text-white">{order.service_name} <span className="text-zinc-600">· {order.country_name}</span></td>
                    <td className="px-4 py-3 text-sm font-bold text-white">${order.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', statusColor(order.status))}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                          <Eye size={13} />
                        </button>
                        {order.status === 'pending' && (
                          <button onClick={() => updateStatus(order.id, 'completed')} className="text-[10px] px-2 py-1 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg transition-colors">
                            Mark done
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button onClick={() => updateStatus(order.id, 'refunded')} className="text-[10px] px-2 py-1 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 rounded-lg transition-colors">
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`} className="border-b border-[#1a1a24] bg-white/2">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          <p className="text-zinc-400"><span className="text-zinc-600">Order ID:</span> {order.id}</p>
                          {order.delivered_content && (
                            <p className="text-violet-300 font-mono break-all">
                              <span className="text-zinc-600">Content: </span>{order.delivered_content}
                            </p>
                          )}
                          <p className="text-zinc-400"><span className="text-zinc-600">Category:</span> {order.category_name}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
