'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, WalletTransaction } from '@/lib/types'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TOPUP_AMOUNTS = [5, 10, 20, 50, 100, 200]

declare global {
  interface Window {
    FlutterwaveCheckout: (config: Record<string, unknown>) => void
  }
}

export default function WalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [customAmount, setCustomAmount] = useState('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [fwLoaded, setFwLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Load Flutterwave script
    if (!document.getElementById('flutterwave-script')) {
      const script = document.createElement('script')
      script.id = 'flutterwave-script'
      script.src = 'https://checkout.flutterwave.com/v3.js'
      script.onload = () => setFwLoaded(true)
      document.head.appendChild(script)
    } else {
      setFwLoaded(true)
    }
  }, [])

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [pRes, txRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ])
    if (pRes.data) setProfile(pRes.data)
    if (txRes.data) setTransactions(txRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleTopup = () => {
    const amount = selectedAmount || Number(customAmount)
    if (!amount || amount < 1) { toast.error('Enter a valid amount'); return }
    if (!profile) { toast.error('Please sign in'); return }
    if (!fwLoaded || !window.FlutterwaveCheckout) { toast.error('Payment system loading, please wait...'); return }

    const reference = `topup_${profile.id}_${Date.now()}`

    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: reference,
      amount,
      currency: 'USD',
      payment_options: 'card,banktransfer,ussd',
      customer: { email: profile.email, name: profile.full_name || profile.email },
      customizations: {
        title: 'JOSIXLOGS Wallet Topup',
        description: `Add $${amount} to your JOSIXLOGS wallet`,
        logo: '',
      },
      callback: async (response: { status: string; tx_ref: string }) => {
        if (response.status === 'successful') {
          toast.success('Payment successful! Balance will update shortly.')
          // Poll for balance update
          setTimeout(async () => { await fetchData() }, 3000)
        } else {
          toast.error('Payment was not completed')
        }
      },
      onclose: () => {},
    })
  }

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Wallet</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your balance and transactions</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Balance card */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-violet-600/20 to-[#12121a] border-violet-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-violet-600/30 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-violet-300" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Available balance</p>
            <p className="font-display text-3xl font-extrabold text-white">${profile?.wallet_balance?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Topup section */}
      <div className="card p-5 mb-6">
        <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={16} className="text-violet-400" /> Top up wallet
        </h2>

        <p className="text-xs text-zinc-500 mb-3">Select amount</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {TOPUP_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelectedAmount(amt); setCustomAmount('') }}
              className={clsx(
                'py-2.5 rounded-xl text-sm font-medium transition-colors',
                selectedAmount === amt
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              )}
            >
              ${amt}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
            placeholder="Custom amount"
            min="1"
            className="w-full pl-8 pr-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
          />
        </div>

        <button
          onClick={handleTopup}
          disabled={!fwLoaded}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={15} />
          {!fwLoaded ? 'Loading payment...' : `Top up${selectedAmount ? ` $${selectedAmount}` : customAmount ? ` $${customAmount}` : ''}`}
        </button>

        <div className="mt-4 pt-4 border-t border-[#1e1e2a]">
          <p className="text-xs text-zinc-600 mb-2">Accepted payment methods</p>
          <div className="flex flex-wrap gap-2">
            {['💳 Debit/Credit card', '🏦 Bank transfer', '📱 USSD'].map((m) => (
              <span key={m} className="text-xs bg-white/5 text-zinc-400 px-2.5 py-1 rounded-lg">{m}</span>
            ))}
          </div>
          <p className="text-[10px] text-zinc-700 mt-2">Crypto & PayPal topup: contact support</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-white mb-4 text-sm">Transaction history</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <Wallet size={24} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#1a1a24] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    tx.type === 'topup' ? 'bg-green-500/15' : tx.type === 'refund' ? 'bg-amber-500/15' : 'bg-red-500/15'
                  )}>
                    {tx.type === 'topup' ? <ArrowDownLeft size={14} className="text-green-400" /> : <ArrowUpRight size={14} className={tx.type === 'refund' ? 'text-amber-400' : 'text-red-400'} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                    <p className="text-[10px] text-zinc-500">{tx.gateway || 'wallet'} · {new Date(tx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={clsx('text-sm font-bold', tx.type === 'topup' || tx.type === 'refund' ? 'text-green-400' : 'text-red-400')}>
                    {tx.type === 'topup' || tx.type === 'refund' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-zinc-600">bal: ${tx.balance_after.toFixed(2)}</p>
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full', tx.status === 'success' ? 'bg-green-500/10 text-green-500' : tx.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400')}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
