import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── ADMIN ROUTES ─────────────────────────────────────────────────────────────
  // Always redirect to /admin-login (never /login) so admin login stays separate
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin-login', req.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      // Signed in but not admin — send to user dashboard, not admin login
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // ── USER DASHBOARD ROUTES ─────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login?next=' + pathname, req.url))
  }

  // ── PREVENT REGULAR USERS FROM SEEING ADMIN LOGIN PAGE ───────────────────
  // If a normal user somehow visits /admin-login while logged in, send to dashboard
  if (pathname === '/admin-login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login', '/dashboard/:path*'],
}
