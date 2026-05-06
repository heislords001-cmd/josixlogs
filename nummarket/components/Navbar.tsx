'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { User, Wallet, ShoppingBag, Menu, X, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') fetchProfile()
      if (event === 'SIGNED_OUT') setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    toast.success('Signed out')
    router.push('/')
  }

  const navLinks = [
    { href: '/store', label: 'Store' },
    { href: '/store?category=virtual-numbers', label: 'Numbers' },
    { href: '/store?category=social-media', label: 'Accounts' },
  ]

  return (
    <header className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#1e1e2a]' : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-display font-800 text-sm text-white group-hover:bg-violet-500 transition-colors">
            JX
          </div>
          <span className="font-display font-700 text-lg tracking-tight text-white group-hover:text-violet-400 transition-colors">
            JOSIXLOGS
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href.split('?')[0])
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              {/* Wallet badge */}
              <Link
                href="/dashboard/wallet"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-600/15 border border-violet-500/20 rounded-lg text-sm text-violet-300 hover:bg-violet-600/25 transition-colors"
              >
                <Wallet size={14} />
                <span className="font-medium">${profile.wallet_balance.toFixed(2)}</span>
              </Link>

              {/* Orders */}
              <Link
                href="/dashboard/orders"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <ShoppingBag size={16} />
              </Link>

              {/* Profile dropdown */}
              <div className="relative group">
                <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 transition-colors">
                  <User size={16} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#12121a] border border-[#2a2a38] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-3 border-b border-[#1e1e2a]">
                    <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                    {profile.role === 'admin' && (
                      <span className="text-[10px] font-medium text-violet-400 bg-violet-600/15 px-1.5 py-0.5 rounded mt-1 inline-block">ADMIN</span>
                    )}
                  </div>
                  <div className="p-1.5">
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    {profile.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-600/10 transition-colors">
                        <Settings size={14} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:block px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0e0e16] border-t border-[#1e1e2a] px-4 py-4 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {label}
            </Link>
          ))}
          {profile && (
            <>
              <div className="pt-2 mt-2 border-t border-[#1e1e2a]">
                <Link href="/dashboard/wallet" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-violet-400 hover:bg-violet-600/10">
                  <Wallet size={14} /> Wallet: ${profile.wallet_balance.toFixed(2)}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
