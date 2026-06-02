import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { StockTable, type ProduitRow } from '@/components/stock/stock-table'
import { StockMobile } from '@/components/cuisinier/stock-mobile'

export default async function StockPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const canSeeFinance = profile?.role === 'patron'
  const canEdit = profile?.role !== 'cuisinier'
  const canDeactivate = profile?.role === 'patron'
  const isCuisinier = profile?.role === 'cuisinier'

  const [{ data: produits }, { data: categories }, { data: fournisseurs }] = await Promise.all([
    supabase
      .from('produits')
      .select('*, categories(nom), fournisseurs(nom)')
      .eq('actif', true)
      .order('nom'),
    supabase.from('categories').select('id, nom').order('nom'),
    supabase.from('fournisseurs').select('id, nom').order('nom'),
  ])

  const rows = (produits ?? []) as unknown as ProduitRow[]
  const cats = categories ?? []

  const desktop = (
    <StockTable
      produits={rows}
      categories={cats}
      fournisseurs={fournisseurs ?? []}
      canSeeFinance={canSeeFinance}
      canEdit={canEdit}
      canDeactivate={canDeactivate}
    />
  )

  // Cuisinier : vue mobile dédiée < md, table classique ≥ md
  if (isCuisinier) {
    return (
      <>
        <div className="md:hidden">
          <StockMobile produits={rows} categories={cats} />
        </div>
        <div className="hidden md:block">{desktop}</div>
      </>
    )
  }

  return desktop
}
