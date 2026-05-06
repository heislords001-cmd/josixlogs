'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Wallet, Settings, LogOut, Menu, X, Store, BarChart2 } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/listings', label: 'Listings', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
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
      <div className="px-4 py-5 border-b border-[#1e1e2a]">
        <Link href="/" className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center font-display font-bold text-xs text-white">JX</div>
          <span className="font-display font-bold text-sm text-white">JOSIXLOGS</span>
        </Link>
        <span className="text-[10px] text-violet-400 font-medium bg-violet-600/15 px-2 py-0.5 rounded-full">ADMIN PANEL</span>
      </div>

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
            <Icon size={15} /> {label}
          </Link>
        ))}
        <div className="pt-2 mt-2 border-t border-[#1e1e2a]">
          <Link href="/store" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            <Store size={15} /> View store
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            <BarChart2 size={15} /> My dashboard
          </Link>
        </div>
      </nav>

      <div className="px-2 pb-4">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-[#0e0e16] border-r border-[#1e1e2a] flex-col z-40">
        <SidebarContent />
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0e0e16] border-b border-[#1e1e2a] h-14 flex items-center justify-between px-4">
        <span className="font-display font-bold text-sm text-white flex items-center gap-2">
          <span className="text-[10px] text-violet-400 bg-violet-600/15 px-2 py-0.5 rounded-full">ADMIN</span> JOSIXLOGS
        </span>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-white/5 text-zinc-400"><Menu size={18} /></button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[#0e0e16] border-r border-[#1e1e2a] flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 text-zinc-400"><X size={16} /></button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
