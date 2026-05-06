import { createClient } from '@/lib/supabase/server'
import { Order } from '@/lib/types'
import { ShoppingBag, Copy } from 'lucide-react'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'

export const metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const allOrders: Order[] = orders || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">My Orders</h1>
        <p className="text-zinc-500 text-sm mt-1">{allOrders.length} order{allOrders.length !== 1 ? 's' : ''} total</p>
      </div>

      {allOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag size={36} className="text-zinc-700 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-white mb-2">No orders yet</h3>
          <p className="text-sm text-zinc-500 mb-6">Your purchases will appear here after checkout.</p>
          <Link href="/store" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
            Browse store
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allOrders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-white text-sm">{order.service_name || 'Digital item'}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                      order.status === 'refunded' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-red-500/15 text-red-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {order.category_name} · {order.country_name} · {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-white">${order.amount.toFixed(2)}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">#{order.id.slice(0, 8)}</p>
                </div>
              </div>

              {order.delivered_content && order.status === 'completed' && (
                <div className="mt-3 p-3 bg-[#0a0a0f] rounded-lg border border-[#1e1e2a]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Delivered content</span>
                    <CopyButton text={order.delivered_content} />
                  </div>
                  <pre className="text-xs text-violet-300 font-mono whitespace-pre-wrap break-all">{order.delivered_content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
