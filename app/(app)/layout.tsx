import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { CuisinierShell } from '@/components/cuisinier/cuisinier-shell'
import type { CuisinierProducto } from '@/components/cuisinier/crear-solicitud-overlay'

type ProdRow = {
  id: string
  nom: string
  unite: string
  stock_actuel: number
  categories: { nom: string } | { nom: string }[] | null
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()
  if (!profile || !profile.actif) redirect('/login')

  // Cuisinier : shell mobile dédié (barre du bas + FAB) + produits pour la création
  if (profile.role === 'cuisinier') {
    const supabase = await createClient()
    const { data } = await supabase
      .from('produits')
      .select('id, nom, unite, stock_actuel, categories(nom)')
      .eq('actif', true)
      .order('nom')

    const productos: CuisinierProducto[] = ((data ?? []) as unknown as ProdRow[]).map((p) => {
      const c = Array.isArray(p.categories) ? p.categories[0] : p.categories
      return {
        id: p.id,
        nom: p.nom,
        unite: p.unite,
        stock_actuel: p.stock_actuel,
        categoria: c?.nom ?? null,
      }
    })

    return (
      <CuisinierShell nom={profile.nom} productos={productos}>
        {children}
      </CuisinierShell>
    )
  }

  return (
    <AppShell nom={profile.nom} role={profile.role}>
      {children}
    </AppShell>
  )
}
