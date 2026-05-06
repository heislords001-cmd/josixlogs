'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [newSvc, setNewSvc] = useState({ name: '', category_id: '', description: '' })
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [catRes, svcRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('services').select('*, category:categories(name)').order('name'),
    ])
    setCategories(catRes.data || [])
    setServices(svcRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveCategory = async () => {
    if (!editing?.name || !editing?.slug) { toast.error('Name and slug required'); return }
    const payload = { name: editing.name, slug: editing.slug, description: editing.description || null, icon: editing.icon || null, sort_order: editing.sort_order || 0, is_active: editing.is_active ?? true }

    if (editing.id) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
      if (error) { toast.error(error.message); return }
    } else {
      const { error } = await supabase.from('categories').insert(payload)
      if (error) { toast.error(error.message); return }
    }
    toast.success(editing.id ? 'Category updated' : 'Category created')
    setEditing(null)
    fetchAll()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? All services under it will also be deleted.')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Category deleted')
    fetchAll()
  }

  const addService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSvc.name || !newSvc.category_id) { toast.error('Name and category required'); return }
    const slug = newSvc.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('services').insert({ name: newSvc.name, slug, category_id: newSvc.category_id, description: newSvc.description || null })
    if (error) { toast.error(error.message); return }
    toast.success('Service added')
    setNewSvc({ name: '', category_id: '', description: '' })
    fetchAll()
  }

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Service deleted')
    fetchAll()
  }

  const inputClass = "w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a38] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60"

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Categories & Services</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage product categories and services</p>
        </div>
        <button onClick={() => setEditing({ is_active: true, sort_order: 0 })} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
          <Plus size={15} /> Add category
        </button>
      </div>

      {/* Category form */}
      {editing !== null && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white text-sm mb-4">{editing.id ? 'Edit category' : 'New category'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Name *</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="Virtual Numbers" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Slug *</label>
              <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="virtual-numbers" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Icon (emoji)</label>
              <input value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="📱" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Sort order</label>
              <input type="number" value={editing.sort_order || 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1.5">Description</label>
              <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Brief description..." className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveCategory} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">
              <Check size={14} /> Save
            </button>
            <button onClick={() => setEditing(null)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 text-sm rounded-lg transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      {loading ? <div className="h-32 bg-white/5 rounded-xl animate-pulse" /> : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[#1e1e2a]"><h2 className="font-display font-semibold text-white text-sm">Categories ({categories.length})</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1e1e2a]">
              {['Icon', 'Name', 'Slug', 'Status', 'Order', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3 text-lg">{cat.icon}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{cat.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-zinc-500">{cat.slug}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-500/15 text-green-400' : 'bg-zinc-500/15 text-zinc-500'}`}>{cat.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{cat.sort_order}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button onClick={() => setEditing(cat)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"><Pencil size={12} /></button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400"><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Services section */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-white text-sm mb-4">Add new service</h2>
        <form onSubmit={addService} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Service name *</label>
            <input value={newSvc.name} onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })} placeholder="WhatsApp Number" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Category *</label>
            <select value={newSvc.category_id} onChange={(e) => setNewSvc({ ...newSvc, category_id: e.target.value })} className={inputClass} required>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors h-10">
            <Plus size={14} /> Add service
          </button>
        </form>
      </div>

      {/* Services list */}
      {!loading && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[#1e1e2a]"><h2 className="font-display font-semibold text-white text-sm">Services ({services.length})</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1e1e2a]">
              {['Name', 'Category', 'Status', 'Actions'].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b border-[#1a1a24] last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3 text-sm font-medium text-white">{svc.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{(svc.category as any)?.name}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${svc.is_active ? 'bg-green-500/15 text-green-400' : 'bg-zinc-500/15 text-zinc-500'}`}>{svc.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteService(svc.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400"><Trash2 size={12} /></button>
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
