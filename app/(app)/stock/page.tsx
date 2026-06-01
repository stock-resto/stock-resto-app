import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { StockTable, type ProduitRow } from '@/components/stock/stock-table'

export default async function StockPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const canSeeFinance = profile?.role === 'patron'
  const canEdit = profile?.role !== 'cuisinier'
  const canDeactivate = profile?.role === 'patron'

  const [{ data: produits }, { data: categories }, { data: fournisseurs }] = await Promise.all([
    supabase
      .from('produits')
      .select('*, categories(nom), fournisseurs(nom)')
      .eq('actif', true)
      .order('nom'),
    supabase.from('categories').select('id, nom').order('nom'),
    supabase.from('fournisseurs').select('id, nom').order('nom'),
  ])

  return (
    <StockTable
      produits={(produits ?? []) as unknown as ProduitRow[]}
      categories={categories ?? []}
      fournisseurs={fournisseurs ?? []}
      canSeeFinance={canSeeFinance}
      canEdit={canEdit}
      canDeactivate={canDeactivate}
    />
  )
}
