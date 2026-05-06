'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { ShoppingCart, Wallet, ArrowLeft, Zap, Globe, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ListingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [listing, setListing] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [purchased, setPurchased] = useState<{ orderId: string; content: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [listingRes, userRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*, service:services(name, description, image_url, category:categories(name, icon, slug))')
          .eq('id', id)
          .single(),
        supabase.auth.getUser(),
      ])

      if (listingRes.error || !listingRes.data) {
        toast.error('Listing not found')
        router.push('/store')
        return
      }
      setListing(listingRes.data)

      if (userRes.data.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userRes.data.user.id)
          .single()
        if (p) setProfile(p)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  const handlePurchase = async () => {
    if (!profile) {
      router.push(`/login?next=/store/${id}`)
      return
    }
    if (profile.wallet_balance < listing.price) {
      toast.error('Insufficient balance — please top up your wallet')
      router.push('/dashboard/wallet')
      return
    }

    setBuying(true)
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Purchase failed')
        return
      }

      // Refresh profile balance
      const { data: updated } = await supabase.from('profiles').select('*').eq('id', profile.id).single()
      if (updated) setProfile(updated)

      setPurchased({ orderId: data.order_id, content: data.delivered_content })
      toast.success('Purchase successful!')
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setBuying(false)
    }
  }

  const copyContent = () => {
    if (!purchased) return
    navigator.clipboard.writeText(purchased.content)
    toast.success('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24">
          <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!listing) return null

  const canAfford = profile && profile.wallet_balance >= listing.price
  const isOutOfStock = listing.stock < 1 || !listing.is_active

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500">
          <Link href="/store" className="flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Store
          </Link>
          <span>/</span>
          <Link href={`/store?category=${listing.service?.category?.slug}`} className="hover:text-white transition-colors">
            {listing.service?.category?.icon} {listing.service?.category?.name}
          </Link>
          <span>/</span>
          <span className="text-white">{listing.service?.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8">

          {/* Left: listing details */}
          <div>
            <div className="card p-6 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-violet-600/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {listing.service?.category?.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">{listing.service?.category?.name}</p>
                  <h1 className="font-display text-2xl font-bold text-white">{listing.service?.name}</h1>
                  {listing.service?.description && (
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{listing.service.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Globe size={14} />, label: 'Country', value: listing.country_name },
                  { icon: <Zap size={14} />, label: 'Delivery', value: listing.delivery_type === 'instant' ? 'Instant' : 'Manual' },
                  { icon: <ShoppingCart size={14} />, label: 'In stock', value: `${listing.stock} available` },
                  { icon: <CheckCircle size={14} />, label: 'Status', value: isOutOfStock ? 'Out of stock' : 'Available' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#0a0a0f] rounded-lg p-3 flex items-center gap-3">
                    <div className="text-violet-400">{item.icon}</div>
                    <div>
                      <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* After purchase: delivered content */}
            {purchased && (
              <div className="card p-5 border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <h3 className="font-display font-semibold text-green-300 text-sm">Purchase complete — here is your item</h3>
                </div>
                <div className="bg-[#0a0a0f] rounded-lg p-4 mb-3 relative">
                  <pre className="text-sm text-white font-mono whitespace-pre-wrap break-all">{purchased.content}</pre>
                  <button
                    onClick={copyContent}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={copyContent} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <Copy size={12} /> Copy
                  </button>
                  <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
                    <ExternalLink size={12} /> View in orders
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: buy panel */}
          <div>
            <div className="card p-5 sticky top-24">
              <div className="mb-5">
                <p className="text-xs text-zinc-500 mb-1">Price</p>
                <p className="font-display text-4xl font-extrabold text-white">${listing.price.toFixed(2)}</p>
              </div>

              {profile && (
                <div className="flex items-center justify-between mb-4 p-3 bg-[#0a0a0f] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-violet-400" />
                    <span className="text-xs text-zinc-400">Your balance</span>
                  </div>
                  <span className={clsx('text-sm font-semibold', canAfford ? 'text-green-400' : 'text-red-400')}>
                    ${profile.wallet_balance.toFixed(2)}
                  </span>
                </div>
              )}

              {!canAfford && profile && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300">
                    You need ${(listing.price - profile.wallet_balance).toFixed(2)} more.{' '}
                    <Link href="/dashboard/wallet" className="underline hover:text-amber-200">Top up wallet</Link>
                  </p>
                </div>
              )}

              {purchased ? (
                <button
                  onClick={() => router.push('/store')}
                  className="w-full py-3.5 bg-green-600/20 border border-green-500/30 text-green-300 font-medium rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Purchased — browse more
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={buying || isOutOfStock}
                  className={clsx(
                    'w-full py-3.5 font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-all',
                    isOutOfStock
                      ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
                      : buying
                        ? 'bg-violet-600/50 text-white/50 cursor-wait'
                        : 'bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-600/20'
                  )}
                >
                  {buying ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : isOutOfStock ? (
                    'Out of stock'
                  ) : !profile ? (
                    <><ShoppingCart size={16} /> Sign in to purchase</>
                  ) : (
                    <><ShoppingCart size={16} /> Buy now — ${listing.price.toFixed(2)}</>
                  )}
                </button>
              )}

              {!profile && !purchased && (
                <p className="text-xs text-zinc-600 text-center mt-3">
                  <Link href="/register" className="text-violet-400 hover:text-violet-300">Create account</Link> to purchase
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-[#1e1e2a] space-y-2">
                {[
                  { icon: <Zap size={12} className="text-violet-400" />, text: 'Instant delivery after payment' },
                  { icon: <CheckCircle size={12} className="text-violet-400" />, text: 'Verified & working guaranteed' },
                  { icon: <Wallet size={12} className="text-violet-400" />, text: 'Deducted from wallet balance' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-xs text-zinc-500">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
