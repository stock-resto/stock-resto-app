import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { DashboardView, type MouvementRecent, type ProduitAlerta } from '@/components/dashboard/dashboard-view'

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const isPatron = profile?.role === 'patron'

  const [{ data: produits }, { count: enEspera }, { data: recientes }] = await Promise.all([
    supabase
      .from('produits')
      .select('nom, unite, stock_actuel, stock_minimum, valeur_unitaire, categories(nom)')
      .eq('actif', true)
      .order('nom'),
    supabase
      .from('demandes')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'en_attente'),
    supabase
      .from('mouvements')
      .select('id, type, quantite, created_at, produits(nom, unite), users(nom)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const all = produits ?? []
  const valorTotal = isPatron
    ? all.reduce((s, p) => s + p.stock_actuel * p.valeur_unitaire, 0)
    : 0

  // Produits en alerta : stock_actuel <= stock_minimum (inclut les agotados)
  const enAlerta = all.filter((p) => p.stock_actuel <= p.stock_minimum) as unknown as ProduitAlerta[]

  const alertaCount = enAlerta.filter((p) => p.stock_actuel > 0).length
  const agotadoCount = enAlerta.filter((p) => p.stock_actuel === 0).length

  return (
    <DashboardView
      isPatron={isPatron}
      nom={profile?.nom ?? ''}
      valorTotal={valorTotal}
      alertaCount={alertaCount}
      agotadoCount={agotadoCount}
      enEsperaCount={enEspera ?? 0}
      enAlerta={enAlerta}
      recientes={(recientes ?? []) as unknown as MouvementRecent[]}
    />
  )
}
