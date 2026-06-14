import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { DemandesList, type DemandeRow } from '@/components/demandes/demandes-list'
import { DemandesMobile } from '@/components/cuisinier/demandes-mobile'
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
        demande_lignes(id, produit_id, quantite, quantite_livree, produits(nom, unite, unite_uso, factor_uso))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('produits')
      .select('id, nom, unite, unite_uso, factor_uso, stock_actuel, stock_minimum')
      .eq('actif', true)
      .order('nom'),
  ])

  const rows = (demandes ?? []) as unknown as DemandeRow[]
  const isCuisinier = profile?.role === 'cuisinier'

  const desktop = (
    <DemandesList
      demandes={rows}
      produits={(produits ?? []) as ProductoOption[]}
      role={profile!.role}
    />
  )

  // Cuisinier : vue mobile dédiée < md (création via le FAB du shell), liste classique ≥ md
  if (isCuisinier) {
    return (
      <>
        <div className="md:hidden">
          <DemandesMobile demandes={rows} />
        </div>
        <div className="hidden md:block">{desktop}</div>
      </>
    )
  }

  return desktop
}
