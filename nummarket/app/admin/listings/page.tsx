'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('*, service:services(name, category:categories(name, icon))')
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchListings() }, [fetchListings])

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('listings').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error('Failed to update'); return }
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !current } : l))
    toast.success(current ? 'Listing deactivated' : 'Listing activated')
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) { toast.error('Delete failed'); setDeleting(null); return }
    setListings((prev) => prev.filter((l) => l.id !== id))
    toast.success('Listing deleted')
    setDeleting(null)
  }

  const filtered = listings.filter((l) =>
    !search ||
    l.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.country_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Listings</h1>
          <p className="text-zinc-500 text-sm mt-1">{listings.length} total listings</p>
        </div>
        <Link href="/admin/listings/new" className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={15} /> Add listing
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2a]">
                {['Service', 'Category', 'Country', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center">
                  <Package size={24} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">No listings found</p>
                  <Link href="/admin/listings/new" className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block">Add your first listing →</Link>
                </td></tr>
              ) : filtered.map((listing) => (
                <tr key={listing.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{listing.service?.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{listing.service?.category?.icon} {listing.service?.category?.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">🌍 {listing.country_name}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">${listing.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', listing.stock > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                      {listing.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(listing.id, listing.is_active)} className={clsx('flex items-center gap-1 text-xs font-medium transition-colors', listing.is_active ? 'text-green-400 hover:text-green-300' : 'text-zinc-500 hover:text-white')}>
                      {listing.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      {listing.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/listings/${listing.id}/edit`} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <Pencil size={13} />
                      </Link>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        disabled={deleting === listing.id}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
