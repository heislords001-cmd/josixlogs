'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) { setProfile(data); setFullName(data.full_name || '') }
    }
    fetch()
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingProfile(true)
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id)
    if (error) toast.error(error.message)
    else { toast.success('Profile updated'); setProfile({ ...profile, full_name: fullName }) }
    setSavingProfile(false)
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); setCurrentPw(''); setNewPw(''); setConfirmPw('') }
    setSavingPw(false)
  }

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Profile */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-violet-400" />
            <h2 className="font-display font-semibold text-white text-sm">Profile information</h2>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Email</label>
              <input value={profile?.email || ''} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
              <p className="text-[10px] text-zinc-600 mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={savingProfile} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {savingProfile ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
              Save changes
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-violet-400" />
            <h2 className="font-display font-semibold text-white text-sm">Change password</h2>
          </div>
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 8 characters" className={inputClass} required />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Confirm new password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat password" className={inputClass} required />
            </div>
            <button type="submit" disabled={savingPw} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
              {savingPw ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={14} />}
              Update password
            </button>
          </form>
        </div>

        {/* Account info */}
        {profile && (
          <div className="card p-5">
            <h2 className="font-display font-semibold text-white text-sm mb-4">Account info</h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Account ID', value: profile.id.slice(0, 16) + '...' },
                { label: 'Member since', value: new Date(profile.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }) },
                { label: 'Account role', value: profile.role.toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#1a1a24] last:border-0">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
