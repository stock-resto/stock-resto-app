import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { MouvementsList, type MouvementRow } from '@/components/stock/mouvements-list'
import type { ProductoOption } from '@/components/stock/entrada-modal'

export default async function MouvementsPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const canEdit = profile?.role !== 'cuisinier'
  const canPatron = profile?.role === 'patron'

  const [{ data: mouvements }, { data: produits }] = await Promise.all([
    supabase
      .from('mouvements')
      .select('id, produit_id, type, quantite, notes, created_at, produits(nom, unite), users(nom)')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('produits')
      .select('id, nom, unite, unite_uso, factor_uso, stock_actuel, stock_minimum')
      .eq('actif', true)
      .order('nom'),
  ])

  return (
    <MouvementsList
      mouvements={(mouvements ?? []) as unknown as MouvementRow[]}
      produits={(produits ?? []) as ProductoOption[]}
      canEdit={canEdit}
      canPatron={canPatron}
    />
  )
}
