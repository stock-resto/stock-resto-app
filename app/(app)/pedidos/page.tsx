import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { PedidosList, type PedidoRow } from '@/components/pedidos/pedidos-list'
import type { ProductoPedido } from '@/components/pedidos/nuevo-pedido-modal'

export default async function PedidosPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const [{ data: pedidos }, { data: produits }, { data: fournisseurs }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        id, numero, statut, note, created_at, enviada_at, recibida_at, cancelada_at,
        fournisseur:fournisseur_id(nom, contact),
        pedido_lineas(id, cantidad_pedida, cantidad_recibida, precio_unitario)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('produits')
      .select('id, nom, unite, presentation, fournisseur_id, stock_actuel, stock_minimum')
      .eq('actif', true)
      .order('nom'),
    supabase.from('fournisseurs').select('id, nom, contact').order('nom'),
  ])

  const rows = (pedidos ?? []) as unknown as PedidoRow[]

  return (
    <PedidosList
      pedidos={rows}
      productos={(produits ?? []) as ProductoPedido[]}
      fournisseurs={(fournisseurs ?? []) as { id: string; nom: string; contact: string | null }[]}
      role={profile!.role}
    />
  )
}
