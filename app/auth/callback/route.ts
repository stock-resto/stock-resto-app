import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Reçoit le lien de récupération de mot de passe (?code=...), échange le code
// contre une session, puis redirige vers /reset-password.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Derrière le proxy Vercel, l'host réel est dans x-forwarded-host.
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin
      return NextResponse.redirect(`${base}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}
