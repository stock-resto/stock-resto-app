import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { SortiesList, type SortieMouvementRow } from '@/components/stock/sorties-list'
import type { ProductoOption } from '@/components/stock/entrada-modal'

export default async function SortiesPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const canEdit = profile?.role !== 'cuisinier'

  const [{ data: mouvements }, { data: produits }] = await Promise.all([
    supabase
      .from('mouvements')
      .select('id, quantite, notes, created_at, produits(nom, unite), users(nom)')
      .eq('type', 'sortie')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('produits')
      .select('id, nom, unite, stock_actuel')
      .eq('actif', true)
      .order('nom'),
  ])

  return (
    <SortiesList
      mouvements={(mouvements ?? []) as unknown as SortieMouvementRow[]}
      produits={(produits ?? []) as ProductoOption[]}
      canEdit={canEdit}
    />
  )
}
