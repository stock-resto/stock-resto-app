import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Next.js 16 : l'ancien « middleware » s'appelle désormais « proxy ».
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Ne pas supprimer — refreshe le token de session
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Pages publiques (accessibles sans session)
  const publicPaths = ['/login', '/signup']

  if (!user) {
    if (publicPaths.includes(pathname)) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (publicPaths.includes(pathname) || pathname === '/') {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const dest = profile?.role === 'cuisinier' ? '/demandes' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Routes réservées au patron
  if (pathname.startsWith('/mouvements') || pathname.startsWith('/utilisateurs')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'patron') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
