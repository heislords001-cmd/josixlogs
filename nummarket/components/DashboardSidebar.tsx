'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { LayoutDashboard, ShoppingBag, Wallet, Settings, LogOut, Menu, X, Store, Shield } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#1e1e2a]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center font-display font-bold text-xs text-white">JX</div>
          <span className="font-display font-bold text-sm text-white">JOSIXLOGS</span>
        </Link>
      </div>

      {/* Profile */}
      <div className="px-4 py-4 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600/20 rounded-full flex items-center justify-center text-violet-400 font-display font-bold text-sm flex-shrink-0">
            {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile.full_name || 'User'}</p>
            <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
          </div>
        </div>
        <div className="mt-3 px-3 py-2 bg-violet-600/10 border border-violet-500/20 rounded-lg flex items-center justify-between">
          <span className="text-xs text-zinc-400">Wallet</span>
          <span className="text-sm font-bold text-violet-300">${profile.wallet_balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive(href, exact)
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        <div className="pt-2 mt-2 border-t border-[#1e1e2a]">
          <Link
            href="/store"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Store size={16} /> Browse store
          </Link>

          {profile.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-600/10 transition-colors"
            >
              <Shield size={16} /> Admin panel
            </Link>
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0e0e16] border-r border-[#1e1e2a] flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0e0e16] border-b border-[#1e1e2a] h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center font-display font-bold text-xs text-white">JX</div>
          <span className="font-display font-bold text-sm text-white">JOSIXLOGS</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-white/5 text-zinc-400">
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[#0e0e16] border-r border-[#1e1e2a] flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-zinc-400">
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
