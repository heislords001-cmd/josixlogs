'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Shield, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminKey, setAdminKey] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Admin access key check (set this in your .env as NEXT_PUBLIC_ADMIN_ACCESS_KEY)
    const correctKey = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY || 'JOSIXLOGS-ADMIN-2024'
    if (adminKey !== correctKey) {
      toast.error('Invalid admin access key')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error('Invalid credentials'); return }

      // Verify admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        toast.error('Access denied — not an admin account')
        return
      }

      toast.success('Welcome, admin')
      router.push('/admin')
      router.refresh()
    } catch {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#070710]">
      {/* Distinct background — different from user login */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] bg-violet-900/15 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8b5cf6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-violet-900/50">
              <Shield size={26} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-white text-xl tracking-tight">JOSIXLOGS</p>
              <p className="text-xs text-violet-400 font-medium bg-violet-600/15 px-3 py-0.5 rounded-full mt-1 border border-violet-500/20">
                ADMIN PORTAL
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0d0d1a] border border-indigo-900/40 rounded-2xl p-6 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-5 pb-5 border-b border-[#1a1a2e]">
            <Lock size={14} className="text-indigo-400" />
            <p className="text-xs text-indigo-300 font-medium">Restricted access — authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">Admin email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@josixlogs.com"
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-[#07070f] border border-[#1a1a2e] rounded-xl text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-10 bg-[#07070f] border border-[#1a1a2e] rounded-xl text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                Admin access key
                <span className="text-zinc-600 ml-1 font-normal">(required)</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter your admin key"
                  required
                  autoComplete="off"
                  className="w-full px-4 py-2.5 pr-10 bg-[#07070f] border border-[#1a1a2e] rounded-xl text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500/60 transition-colors font-mono"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-700 mt-1">Contact your system administrator for your access key.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-wait text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-900/30"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                : <><Shield size={15} /> Access admin panel</>
              }
            </button>
          </form>
        </div>

        {/* Discreet link back — not obvious */}
        <p className="text-center mt-6 text-[11px] text-zinc-800 hover:text-zinc-600 transition-colors cursor-pointer" onClick={() => router.push('/')}>
          ← Return to site
        </p>
      </div>
    </div>
  )
}
