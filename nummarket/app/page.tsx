import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ArrowRight, Zap, Globe, Shield, Clock } from 'lucide-react'
import { Category } from '@/lib/types'

async function FeaturedListings() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('*, service:services(name, category:categories(name, icon))')
    .eq('is_active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(8)

  if (!listings?.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl font-bold text-white">Latest listings</h2>
        <Link href="/store" className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(listings as any[]).map((listing) => (
          <Link
            key={listing.id}
            href={`/store/${listing.id}`}
            className="group card p-4 hover:border-violet-500/40 hover:bg-violet-600/5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs text-zinc-500 font-medium">
                  {listing.service?.category?.icon} {listing.service?.category?.name}
                </span>
                <h3 className="font-display font-semibold text-sm text-white mt-0.5 group-hover:text-violet-300 transition-colors">
                  {listing.service?.name}
                </h3>
              </div>
              <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">{listing.stock} left</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">🌍 {listing.country_name}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-display font-bold text-lg text-white">${listing.price.toFixed(2)}</span>
              <span className="text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Buy now <ArrowRight size={10} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

async function CategoriesSection() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (!categories?.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <h2 className="font-display text-2xl font-bold text-white mb-8">Browse by category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(categories as Category[]).map((cat) => (
          <Link
            key={cat.id}
            href={`/store?category=${cat.slug}`}
            className="group card p-5 text-center hover:border-violet-500/40 hover:bg-violet-600/5 transition-all duration-200"
          >
            <div className="text-3xl mb-3">{cat.icon}</div>
            <h3 className="font-display font-semibold text-sm text-white group-hover:text-violet-300 transition-colors leading-tight">
              {cat.name}
            </h3>
            {cat.description && (
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">{cat.description}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}

const features = [
  { icon: <Zap size={20} className="text-violet-400" />, title: 'Instant delivery', desc: 'Get your number or account the moment you purchase.' },
  { icon: <Globe size={20} className="text-violet-400" />, title: 'All countries', desc: 'Numbers and accounts available for every country worldwide.' },
  { icon: <Shield size={20} className="text-violet-400" />, title: 'Secure & private', desc: 'All transactions are encrypted and your data stays safe.' },
  { icon: <Clock size={20} className="text-violet-400" />, title: '24/7 available', desc: 'Shop anytime. Our platform never sleeps.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600/15 border border-violet-500/20 rounded-full text-xs text-violet-300 font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            All countries · Instant delivery · Secure payments
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Premium digital<br />
            <span className="text-gradient">numbers & accounts</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Virtual phone numbers, social media accounts, email accounts and more — for every country, at the best prices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/store" className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              Browse store <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="w-9 h-9 bg-violet-600/15 rounded-lg flex items-center justify-center mb-3">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold text-sm text-white mb-1">{f.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <ErrorBoundary>
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20"><div className="h-32 bg-white/5 rounded-xl animate-pulse" /></div>}>
          <CategoriesSection />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary>
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20"><div className="h-64 bg-white/5 rounded-xl animate-pulse" /></div>}>
          <FeaturedListings />
        </Suspense>
      </ErrorBoundary>

      <footer className="border-t border-[#1e1e2a] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center text-xs font-display font-bold text-white">JX</div>
            <span className="font-display font-bold text-sm text-white">JOSIXLOGS</span>
          </div>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} JOSIXLOGS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/store" className="text-xs text-zinc-500 hover:text-white transition-colors">Store</Link>
            <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
