'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Service, Category } from '@/lib/types'
import { ArrowLeft, Plus, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Country list (ISO 3166-1 sample — extend as needed)
const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'NG', name: 'Nigeria' }, { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' }, { code: 'ZA', name: 'South Africa' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' }, { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' }, { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' }, { code: 'TR', name: 'Turkey' },
  { code: 'PK', name: 'Pakistan' }, { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' }, { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' }, { code: 'EG', name: 'Egypt' },
  { code: 'UG', name: 'Uganda' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'CM', name: 'Cameroon' },
  { code: 'SN', name: 'Senegal' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'Other', name: 'Other / Global' },
].sort((a, b) => a.name.localeCompare(b.name))

export default function ListingFormPage() {
  const params = useParams()
  const isEdit = params?.id && params.id !== 'new'
  const router = useRouter()
  const supabase = createClient()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [bulkItems, setBulkItems] = useState('')

  const [form, setForm] = useState({
    service_id: '',
    country_code: 'US',
    country_name: 'United States',
    price: '',
    stock: '0',
    delivery_type: 'instant',
    is_active: true,
    notes: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: svc } = await supabase
        .from('services')
        .select('*, category:categories(name, icon)')
        .eq('is_active', true)
        .order('name')
      setServices(svc || [])

      if (isEdit) {
        const { data: listing } = await supabase.from('listings').select('*').eq('id', params.id).single()
        if (listing) setForm({ ...listing, price: listing.price.toString(), stock: listing.stock.toString() })
      }
    }
    init()
  }, [isEdit])

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code)
    setForm((prev) => ({ ...prev, country_code: code, country_name: country?.name || code }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.service_id) { toast.error('Select a service'); return }
    if (!form.price || Number(form.price) <= 0) { toast.error('Enter a valid price'); return }
    setLoading(true)

    try {
      const payload = {
        service_id: form.service_id,
        country_code: form.country_code,
        country_name: form.country_name,
        price: Number(form.price),
        stock: Number(form.stock),
        delivery_type: form.delivery_type,
        is_active: form.is_active,
        notes: form.notes || null,
      }

      let listingId = params?.id as string

      if (isEdit) {
        const { error } = await supabase.from('listings').update(payload).eq('id', listingId)
        if (error) throw error
        toast.success('Listing updated!')
      } else {
        const { data, error } = await supabase.from('listings').insert(payload).select('id').single()
        if (error) throw error
        listingId = data.id
        toast.success('Listing created!')
      }

      // Bulk add items if provided
      if (bulkItems.trim()) {
        const lines = bulkItems.trim().split('\n').map((l) => l.trim()).filter(Boolean)
        const items = lines.map((content) => ({ listing_id: listingId, content, is_sold: false }))
        const { error: itemErr } = await supabase.from('listing_items').insert(items)
        if (itemErr) toast.error('Listing saved but some items failed to add')
        else toast.success(`${lines.length} item(s) added`)
      }

      router.push('/admin/listings')
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div>
      <label className="text-xs font-medium text-zinc-400 block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  )

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0f] border border-[#2a2a38] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/listings" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{isEdit ? 'Edit listing' : 'New listing'}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{isEdit ? 'Update listing details' : 'Add a new item for sale'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-display font-semibold text-white text-sm">Listing details</h2>

            {field('Service', (
              <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className={inputClass} required>
                <option value="">Select a service</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.category?.icon} {s.category?.name} → {s.name}</option>
                ))}
              </select>
            ))}

            {field('Country', (
              <select value={form.country_code} onChange={(e) => handleCountryChange(e.target.value)} className={inputClass}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            ))}

            <div className="grid grid-cols-2 gap-4">
              {field('Price (USD)', (
                <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className={inputClass} required />
              ))}
              {field('Initial stock', (
                <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
              ), 'Set to 0 if adding items below')}
            </div>

            {field('Delivery type', (
              <select value={form.delivery_type} onChange={(e) => setForm({ ...form, delivery_type: e.target.value })} className={inputClass}>
                <option value="instant">Instant (auto-deliver from stock)</option>
                <option value="manual">Manual (admin fulfills)</option>
              </select>
            ))}

            {field('Admin notes (optional)', (
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Internal notes..." className={inputClass} />
            ))}

            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-violet-600" />
              <label htmlFor="is_active" className="text-sm text-zinc-300">Active (visible in store)</label>
            </div>
          </div>

          {/* Bulk items */}
          <div className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
              <Upload size={14} className="text-violet-400" /> Bulk add items
            </h2>
            <p className="text-xs text-zinc-500">One item per line. For numbers: just the number. For accounts: format however you need (e.g. <code className="text-violet-400">email:password</code>).</p>
            <textarea
              value={bulkItems}
              onChange={(e) => setBulkItems(e.target.value)}
              rows={8}
              placeholder={"+1234567890\n+0987654321\nuser@email.com:pass123\n..."}
              className={`${inputClass} font-mono text-xs`}
            />
            {bulkItems.trim() && (
              <p className="text-xs text-violet-400">{bulkItems.trim().split('\n').filter(Boolean).length} items ready to add</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-8">
            <h2 className="font-display font-semibold text-white text-sm mb-4">Publish</h2>
            <div className="space-y-3 mb-5 text-xs text-zinc-500">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className={form.is_active ? 'text-green-400' : 'text-zinc-500'}>{form.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Price</span>
                <span className="text-white">{form.price ? `$${Number(form.price).toFixed(2)}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Country</span>
                <span className="text-white">{form.country_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="text-white capitalize">{form.delivery_type}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
              {loading ? 'Saving...' : isEdit ? 'Update listing' : 'Create listing'}
            </button>

            <Link href="/admin/listings" className="block text-center text-xs text-zinc-500 hover:text-white mt-3 transition-colors">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
