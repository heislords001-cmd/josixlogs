import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MaintenancePage() {
  // Allow admin to bypass
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') redirect('/store')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0f]">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🔧</div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">Under maintenance</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          We're working on some improvements. JOSIXLOGS will be back shortly.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/15 border border-violet-500/20 rounded-full text-xs text-violet-300">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          Maintenance in progress
        </div>
      </div>
    </div>
  )
}
