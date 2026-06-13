import { createClient } from '@/lib/supabase/server'
import { PrepararPedidos, type AlertaProducto } from '@/components/pedidos/preparar-pedidos'

type ProdRow = {
  id: string
  nom: string
  unite: string
  unite_achat: string | null
  factor_achat: number | null
  stock_actuel: number
  stock_minimum: number
  stock_maximum: number | null
  fournisseur_id: string | null
  fournisseur: { nom: string } | null
}

export default async function PrepararPedidosPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('produits')
    .select('id, nom, unite, unite_achat, factor_achat, stock_actuel, stock_minimum, stock_maximum, fournisseur_id, fournisseur:fournisseur_id(nom)')
    .eq('actif', true)
    .order('nom')

  // Productos por debajo (o igual) del mínimo
  const alertas: AlertaProducto[] = ((data ?? []) as unknown as ProdRow[])
    .filter((p) => Number(p.stock_actuel) <= Number(p.stock_minimum))
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      unite: p.unite,
      unite_achat: p.unite_achat ?? null,
      factor_achat: p.factor_achat != null ? Number(p.factor_achat) : null,
      stock_actuel: Number(p.stock_actuel),
      stock_minimum: Number(p.stock_minimum),
      stock_maximum: p.stock_maximum === null ? null : Number(p.stock_maximum),
      fournisseur_id: p.fournisseur_id,
      fournisseur_nom: p.fournisseur?.nom ?? null,
    }))

  return <PrepararPedidos alertas={alertas} />
}
