import { getProfile } from '@/lib/dal'

export default async function DashboardPage() {
  const profile = await getProfile()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Panel principal</h1>
      <p className="text-zinc-500 mt-1">Bienvenido, {profile?.nom}</p>
    </div>
  )
}
