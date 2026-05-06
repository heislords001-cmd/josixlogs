'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { createClient } from '@/lib/supabase/client'
import { Category, Service } from '@/lib/types'
import { Search, Filter, X, ChevronDown, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

export default function StorePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [countries, setCountries] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select('*, service:services(id, name, slug, category:categories(id, name, slug, icon))')
        .eq('is_active', true)
        .gt('stock', 0)

      if (selectedCategory) {
        query = query.eq('service.category.slug', selectedCategory)
      }
      if (selectedCountry) {
        query = query.eq('country_code', selectedCountry)
      }
      if (search) {
        query = query.ilike('country_name', `%${search}%`)
      }

      if (sortBy === 'price_asc') query = query.order('price', { ascending: true })
      else if (sortBy === 'price_desc') query = query.order('price', { ascending: false })
      else query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      const filtered = selectedCategory
        ? (data || []).filter((l: any) => l.service?.category?.slug === selectedCategory)
        : (data || [])

      setListings(filtered)

      // Extract unique countries
      const uniqueCountries = [...new Set(filtered.map((l: any) => l.country_code + '|' + l.country_name))]
      setCountries(uniqueCountries as string[])
    } catch (err) {
      console.error('Failed to fetch listings:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedCountry, search, sortBy])

  useEffect(() => { fetchListings() }, [fetchListings])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    router.replace(`/store${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }, [selectedCategory])

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedCountry('')
    setSearch('')
    setSortBy('newest')
  }

  const hasFilters = selectedCategory || selectedCountry || search

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Store</h1>
          <p className="text-zinc-500 text-sm">Browse all available numbers, accounts and digital services</p>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by country or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              showFilters || hasFilters
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'bg-[#12121a] border-[#2a2a38] text-zinc-400 hover:text-white'
            )}
          >
            <Filter size={15} />
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-[#12121a] border border-[#2a2a38] rounded-xl text-sm text-zinc-400 focus:outline-none focus:border-violet-500/60 transition-colors"
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', !selectedCategory ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white')}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', selectedCategory === cat.slug ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white')}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-2 block">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a38] rounded-lg text-sm text-zinc-400 focus:outline-none focus:border-violet-500/60"
              >
                <option value="">All countries</option>
                {countries.map((c) => {
                  const [code, name] = c.split('|')
                  return <option key={code} value={code}>{name}</option>
                })}
              </select>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="sm:col-span-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors w-fit">
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Category quick tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={clsx('flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors', !selectedCategory ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={clsx('flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', selectedCategory === cat.slug ? 'bg-violet-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white')}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-4 h-32 animate-pulse bg-white/3" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-display font-semibold text-white mb-2">No listings found</h3>
            <p className="text-zinc-500 text-sm mb-6">Try adjusting your filters or check back later.</p>
            <button onClick={clearFilters} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 mb-4">{listings.length} result{listings.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/store/${listing.id}`}
                  className="group card p-4 hover:border-violet-500/40 hover:bg-violet-600/5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-zinc-500 font-medium block">
                        {listing.service?.category?.icon} {listing.service?.category?.name}
                      </span>
                      <h3 className="font-display font-semibold text-sm text-white mt-0.5 group-hover:text-violet-300 transition-colors truncate">
                        {listing.service?.name}
                      </h3>
                    </div>
                    <span className="flex-shrink-0 ml-2 text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
                      {listing.stock} left
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">🌍 {listing.country_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xl text-white">${listing.price.toFixed(2)}</span>
                    <span className="text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Buy <ArrowRight size={10} />
                    </span>
                  </div>
                  {listing.delivery_type === 'instant' && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span className="text-[10px] text-green-500">Instant delivery</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
