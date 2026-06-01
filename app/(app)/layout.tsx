import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/dal'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile || !profile.actif) redirect('/login')

  return (
    <AppShell nom={profile.nom} role={profile.role}>
      {children}
    </AppShell>
  )
}
