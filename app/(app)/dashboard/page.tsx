import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import {
  DashboardView,
  type MouvementRecent,
  type ProduitAlerta,
  type DemandeResumen,
} from '@/components/dashboard/dashboard-view'

export default async function DashboardPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const isPatron = profile?.role === 'patron'

  const [{ data: produits }, { data: pendientes }, { data: recientes }] = await Promise.all([
    supabase
      .from('produits')
      .select('nom, unite, stock_actuel, stock_minimum, valeur_unitaire, categories(nom)')
      .eq('actif', true)
      .order('nom'),
    supabase
      .from('demandes')
      .select('id, numero, created_at, cuisinier:users!cuisinier_id(nom), demande_lignes(id)')
      .eq('statut', 'en_attente')
      .order('numero', { ascending: false })
      .limit(5),
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
      enEsperaCount={pendientes?.length ?? 0}
      enAlerta={enAlerta}
      pendientes={(pendientes ?? []) as unknown as DemandeResumen[]}
      recientes={(recientes ?? []) as unknown as MouvementRecent[]}
    />
  )
}
