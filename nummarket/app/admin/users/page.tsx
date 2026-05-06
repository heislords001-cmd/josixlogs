'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { Search, Ban, CheckCircle, Wallet, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adjusting, setAdjusting] = useState<{ id: string; balance: string } | null>(null)
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const toggleBan = async (id: string, banned: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !banned }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_banned: !banned } : u))
    toast.success(banned ? 'User unbanned' : 'User banned')
  }

  const adjustWallet = async (id: string) => {
    if (!adjusting) return
    const amount = Number(adjusting.balance)
    if (isNaN(amount)) { toast.error('Invalid amount'); return }

    const user = users.find((u) => u.id === id)
    if (!user) return

    const { error } = await supabase.from('profiles').update({ wallet_balance: amount }).eq('id', id)
    if (error) { toast.error('Failed to update balance'); return }

    // Record transaction
    await supabase.from('wallet_transactions').insert({
      user_id: id,
      type: 'topup',
      amount: amount - user.wallet_balance,
      balance_before: user.wallet_balance,
      balance_after: amount,
      status: 'success',
      gateway: 'admin',
    })

    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, wallet_balance: amount } : u))
    setAdjusting(null)
    toast.success('Balance updated')
  }

  const filtered = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Users</h1>
        <p className="text-zinc-500 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2a]">
                {['User', 'Role', 'Balance', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{user.full_name || 'No name'}</p>
                      <p className="text-xs text-zinc-500 truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', user.role === 'admin' ? 'bg-violet-600/20 text-violet-300' : 'bg-white/5 text-zinc-400')}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {adjusting?.id === user.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={adjusting.balance}
                          onChange={(e) => setAdjusting({ ...adjusting, balance: e.target.value })}
                          className="w-24 px-2 py-1 bg-[#0a0a0f] border border-violet-500/40 rounded-lg text-sm text-white focus:outline-none"
                        />
                        <button onClick={() => adjustWallet(user.id)} className="text-xs text-green-400 hover:text-green-300 font-medium">Save</button>
                        <button onClick={() => setAdjusting(null)} className="text-xs text-zinc-500 hover:text-white">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAdjusting({ id: user.id, balance: user.wallet_balance.toFixed(2) })}
                        className="flex items-center gap-1 text-sm font-bold text-white hover:text-violet-300 transition-colors"
                      >
                        ${user.wallet_balance.toFixed(2)}
                        <Wallet size={11} className="text-zinc-600" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full', user.is_banned ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400')}>
                      {user.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      className={clsx('flex items-center gap-1 text-xs font-medium transition-colors', user.is_banned ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300')}
                    >
                      {user.is_banned ? <><CheckCircle size={13} /> Unban</> : <><Ban size={13} /> Ban</>}
                    </button>
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
