'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WalletTransaction } from '@/lib/types'
import { Search, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

export default function AdminWalletsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stats, setStats] = useState({ totalTopups: 0, totalPurchases: 0, totalRefunds: 0 })
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('wallet_transactions')
      .select('*, profile:profiles(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(300)

    if (typeFilter) query = query.eq('type', typeFilter)
    if (statusFilter) query = query.eq('status', statusFilter)

    const { data } = await query
    const txList = data || []
    setTransactions(txList)

    setStats({
      totalTopups: txList.filter((t) => t.type === 'topup' && t.status === 'success').reduce((s: number, t: any) => s + t.amount, 0),
      totalPurchases: txList.filter((t) => t.type === 'purchase').reduce((s: number, t: any) => s + Math.abs(t.amount), 0),
      totalRefunds: txList.filter((t) => t.type === 'refund').reduce((s: number, t: any) => s + t.amount, 0),
    })

    setLoading(false)
  }, [typeFilter, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = transactions.filter((t) =>
    !search ||
    t.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.reference?.toLowerCase().includes(search.toLowerCase())
  )

  const statCards = [
    { label: 'Total topped up', value: `$${stats.totalTopups.toFixed(2)}`, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total purchases', value: `$${stats.totalPurchases.toFixed(2)}`, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Total refunds', value: `$${stats.totalRefunds.toFixed(2)}`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Wallets</h1>
          <p className="text-zinc-500 text-sm mt-1">All platform wallet transactions</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or reference..." className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-zinc-400 focus:outline-none">
          <option value="">All types</option>
          <option value="topup">Topup</option>
          <option value="purchase">Purchase</option>
          <option value="refund">Refund</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-zinc-400 focus:outline-none">
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2a]">
                {['User', 'Type', 'Amount', 'Balance after', 'Gateway', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-zinc-600">No transactions found</td></tr>
              ) : filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-400 max-w-[160px] truncate">{tx.profile?.email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {tx.type === 'topup' || tx.type === 'refund'
                        ? <ArrowDownLeft size={12} className="text-green-400" />
                        : <ArrowUpRight size={12} className="text-red-400" />}
                      <span className="text-xs capitalize text-white">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-sm font-bold', tx.amount > 0 ? 'text-green-400' : 'text-red-400')}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">${tx.balance_after.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 capitalize">{tx.gateway || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium',
                      tx.status === 'success' ? 'bg-green-500/15 text-green-400' :
                      tx.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    )}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
