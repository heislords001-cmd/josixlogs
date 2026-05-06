'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, RefreshCw, AlertTriangle, Globe, DollarSign, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('site_settings').select('*')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((s: any) => { map[s.key] = s.value || '' })
      setSettings(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' })
      if (error) throw error
      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Global platform configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSettings} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            Save all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={15} className="text-violet-400" />
            <h2 className="font-display font-semibold text-white text-sm">General</h2>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Site name</label>
            <input value={settings.site_name || ''} onChange={(e) => set('site_name', e.target.value)} placeholder="JOSIXLOGS" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Support email</label>
            <input value={settings.support_email || ''} onChange={(e) => set('support_email', e.target.value)} placeholder="support@josixlogs.com" type="email" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Site announcement</label>
            <textarea value={settings.announcement || ''} onChange={(e) => set('announcement', e.target.value)} placeholder="Optional banner message shown to all users..." rows={3} className={inputClass} />
            <p className="text-[10px] text-zinc-600 mt-1">Leave empty to hide the announcement banner</p>
          </div>
        </div>

        {/* Payment */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} className="text-violet-400" />
            <h2 className="font-display font-semibold text-white text-sm">Payments</h2>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Min topup amount (USD)</label>
            <input type="number" min="1" value={settings.min_topup_amount || ''} onChange={(e) => set('min_topup_amount', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Max topup amount (USD)</label>
            <input type="number" min="1" value={settings.max_topup_amount || ''} onChange={(e) => set('max_topup_amount', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Crypto wallet address (USDT)</label>
            <input value={settings.crypto_usdt_address || ''} onChange={(e) => set('crypto_usdt_address', e.target.value)} placeholder="TRC20 or ERC20 address" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">PayPal email</label>
            <input type="email" value={settings.paypal_email || ''} onChange={(e) => set('paypal_email', e.target.value)} placeholder="payments@josixlogs.com" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Bank transfer details</label>
            <textarea value={settings.bank_details || ''} onChange={(e) => set('bank_details', e.target.value)} placeholder="Bank name, account number, sort code..." rows={3} className={inputClass} />
          </div>
        </div>

        {/* Maintenance */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <h2 className="font-display font-semibold text-white text-sm">Maintenance & Access</h2>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="maintenance"
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => set('maintenance_mode', e.target.checked ? 'true' : 'false')}
                className="w-4 h-4 accent-amber-500"
              />
              <div>
                <label htmlFor="maintenance" className="text-sm text-white font-medium cursor-pointer">Maintenance mode</label>
                <p className="text-xs text-zinc-500 mt-0.5">Disables the store for regular users. Admin panel stays accessible.</p>
              </div>
            </div>
            {settings.maintenance_mode === 'true' && (
              <span className="flex-shrink-0 text-xs px-2 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-lg font-medium">
                ⚠️ Site is in maintenance
              </span>
            )}
          </div>
          <div className="mt-4">
            <label className="text-xs text-zinc-400 block mb-1.5">Maintenance message</label>
            <input value={settings.maintenance_message || ''} onChange={(e) => set('maintenance_message', e.target.value)} placeholder="We're upgrading our systems. Back shortly." className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  )
}
