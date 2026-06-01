import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { DemandesList, type DemandeRow } from '@/components/demandes/demandes-list'
import type { ProductoOption } from '@/components/stock/entrada-modal'

export default async function DemandesPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const [{ data: demandes }, { data: produits }] = await Promise.all([
    supabase
      .from('demandes')
      .select(`
        id, numero, statut, note, created_at, traite_at, livre_at,
        cuisinier:cuisinier_id(nom),
        gestionnaire:gestionnaire_id(nom),
        demande_lignes(id, produit_id, quantite, quantite_livree, produits(nom, unite))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('produits')
      .select('id, nom, unite, stock_actuel, stock_minimum')
      .eq('actif', true)
      .order('nom'),
  ])

  return (
    <DemandesList
      demandes={(demandes ?? []) as unknown as DemandeRow[]}
      produits={(produits ?? []) as ProductoOption[]}
      role={profile!.role}
    />
  )
}
