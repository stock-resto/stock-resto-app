import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/dal'

// Layout minimal pour les documents imprimables : pas de sidebar, pas de header.
export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile || !profile.actif || profile.role === 'cuisinier') redirect('/login')

  return <div className="min-h-screen bg-white">{children}</div>
}
