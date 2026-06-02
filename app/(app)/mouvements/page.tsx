import { createClient } from '@/lib/supabase/server'
import { MouvementsList, type MouvementRow } from '@/components/stock/mouvements-list'

export default async function MouvementsPage() {
  const supabase = await createClient()

  const { data: mouvements } = await supabase
    .from('mouvements')
    .select('id, type, quantite, notes, created_at, produits(nom, unite), users(nom)')
    .order('created_at', { ascending: false })
    .limit(500)

  return <MouvementsList mouvements={(mouvements ?? []) as unknown as MouvementRow[]} />
}
