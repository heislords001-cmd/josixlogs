import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      <DashboardSidebar profile={profile} />
      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
