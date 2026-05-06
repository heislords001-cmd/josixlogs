'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Upload, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' }, { code: 'ZA', name: 'South Africa' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' }, { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' }, { code: 'MX', name: 'Mexico' },
  { code: 'PH', name: 'Philippines' }, { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' }, { code: 'EG', name: 'Egypt' },
  { code: 'Other', name: 'Other / Global' },
].sort((a, b) => a.name.localeCompare(b.name))

export default function EditListingPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [bulkItems, setBulkItems] = useState('')
  const [form, setForm] = useState({
    service_id: '', country_code: 'US', country_name: 'United States',
    price: '', stock: '0', delivery_type: 'instant', is_active: true, notes: '',
  })

  useEffect(() => {
    const init = async () => {
      const [svcRes, listingRes] = await Promise.all([
        supabase.from('services').select('*, category:categories(name, icon)').eq('is_active', true).order('name'),
        supabase.from('listings').select('*').eq('id', params.id).single(),
      ])
      setServices(svcRes.data || [])
      if (listingRes.data) {
        const l = listingRes.data
        setForm({ ...l, price: l.price.toString(), stock: l.stock.toString(), notes: l.notes || '' })
      }
      setFetching(false)
    }
    init()
  }, [params.id])

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code)
    setForm((prev) => ({ ...prev, country_code: code, country_name: country?.name || code }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.price || Number(form.price) <= 0) { toast.error('Enter a valid price'); return }
    setLoading(true)
    try {
      const payload = {
        service_id: form.service_id, country_code: form.country_code,
        country_name: form.country_name, price: Number(form.price),
        stock: Number(form.stock), delivery_type: form.delivery_type,
        is_active: form.is_active, notes: form.notes || null,
      }
      const { error } = await supabase.from('listings').update(payload).eq('id', params.id)
      if (error) throw error

      if (bulkItems.trim()) {
        const lines = bulkItems.trim().split('\n').map((l) => l.trim()).filter(Boolean)
        const items = lines.map((content) => ({ listing_id: params.id, content, is_sold: false }))
        await supabase.from('listing_items').insert(items)
        toast.success(`${lines.length} items added`)
      }

      toast.success('Listing updated!')
      router.push('/admin/listings')
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"

  if (fetching) return <div className="h-64 bg-white/5 rounded-xl animate-pulse" />

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/listings" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Edit listing</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Update listing details and add more items</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-display font-semibold text-white text-sm">Listing details</h2>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Service</label>
              <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className={inputClass} required>
                <option value="">Select a service</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.category?.icon} {s.category?.name} → {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Country</label>
              <select value={form.country_code} onChange={(e) => handleCountryChange(e.target.value)} className={inputClass}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Price (USD)</label>
                <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Stock</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Delivery type</label>
              <select value={form.delivery_type} onChange={(e) => setForm({ ...form, delivery_type: e.target.value })} className={inputClass}>
                <option value="instant">Instant</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Admin notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-violet-600" />
              <label htmlFor="is_active" className="text-sm text-zinc-300">Active (visible in store)</label>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
              <Upload size={14} className="text-violet-400" /> Add more items
            </h2>
            <p className="text-xs text-zinc-500">One item per line. New items will be appended to existing stock.</p>
            <textarea value={bulkItems} onChange={(e) => setBulkItems(e.target.value)} rows={6}
              placeholder="+1234567890&#10;user@email.com:pass123"
              className={`${inputClass} font-mono text-xs`} />
            {bulkItems.trim() && (
              <p className="text-xs text-violet-400">{bulkItems.trim().split('\n').filter(Boolean).length} items ready to add</p>
            )}
          </div>
        </div>

        <div>
          <div className="card p-5 sticky top-8">
            <h2 className="font-display font-semibold text-white text-sm mb-4">Save changes</h2>
            <div className="space-y-2 mb-5 text-xs text-zinc-500">
              <div className="flex justify-between"><span>Price</span><span className="text-white">{form.price ? `$${Number(form.price).toFixed(2)}` : '—'}</span></div>
              <div className="flex justify-between"><span>Country</span><span className="text-white">{form.country_name}</span></div>
              <div className="flex justify-between"><span>Status</span><span className={form.is_active ? 'text-green-400' : 'text-zinc-500'}>{form.is_active ? 'Active' : 'Inactive'}</span></div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
              {loading ? 'Saving...' : 'Update listing'}
            </button>
            <Link href="/admin/listings" className="block text-center text-xs text-zinc-500 hover:text-white mt-3 transition-colors">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  )
}
