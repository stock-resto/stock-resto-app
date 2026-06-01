import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { EntradasList, type MouvementRow } from '@/components/stock/entradas-list'
import type { ProductoOption } from '@/components/stock/entrada-modal'

export default async function EntreesPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const canEdit = profile?.role !== 'cuisinier'
  const canPatron = profile?.role === 'patron'

  const [{ data: mouvements }, { data: produits }] = await Promise.all([
    supabase
      .from('mouvements')
      .select('id, produit_id, type, quantite, notes, created_at, produits(nom, unite), users(nom)')
      .eq('type', 'entree')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('produits')
      .select('id, nom, unite, stock_actuel, stock_minimum')
      .eq('actif', true)
      .order('nom'),
  ])

  return (
    <EntradasList
      mouvements={(mouvements ?? []) as unknown as MouvementRow[]}
      produits={(produits ?? []) as ProductoOption[]}
      canEdit={canEdit}
      canPatron={canPatron}
    />
  )
}
