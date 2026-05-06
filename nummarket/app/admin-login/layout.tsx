import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin Portal',
  robots: { index: false, follow: false }, // hide from search engines
}

export default async function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  // If already logged in as admin, redirect straight to panel
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') {
      redirect('/admin')
    }
  }

  return <>{children}</>
}
