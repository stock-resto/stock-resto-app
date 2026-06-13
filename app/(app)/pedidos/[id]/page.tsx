import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { PedidoDetail, type PedidoDetailData, type LineaDetail, type ProductoFournisseur } from '@/components/pedidos/pedido-detail'

type LigneRow = {
  id: string
  produit_id: string
  cantidad_pedida: number
  cantidad_recibida: number
  precio_unitario: number
  unite_achat: string | null
  factor_achat: number | null
  produits: { nom: string; unite: string; presentation: string | null } | null
}

type PedidoRow = {
  id: string
  numero: number
  statut: string
  note: string | null
  created_at: string
  enviada_at: string | null
  recibida_at: string | null
  cancelada_at: string | null
  fournisseur: { id: string; nom: string; contact: string | null } | null
  pedido_lineas: LigneRow[]
}

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getProfile()
  const isPatron = profile?.role === 'patron'

  const { data } = await supabase
    .from('pedidos')
    .select(`
      id, numero, statut, note, created_at, enviada_at, recibida_at, cancelada_at,
      fournisseur:fournisseur_id(id, nom, contact),
      pedido_lineas(id, produit_id, cantidad_pedida, cantidad_recibida, precio_unitario, unite_achat, factor_achat, produits(nom, unite, presentation))
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()
  const pedido = data as unknown as PedidoRow

  const lineas: LineaDetail[] = pedido.pedido_lineas
    .map((l) => ({
      id: l.id,
      produit_id: l.produit_id,
      nom: l.produits?.nom ?? '—',
      presentation: l.produits?.presentation ?? null,
      unite: l.produits?.unite ?? '',
      uniteAchat: l.unite_achat ?? null,
      factor: l.factor_achat != null && Number(l.factor_achat) > 0 ? Number(l.factor_achat) : 1,
      cantidad_pedida: Number(l.cantidad_pedida),
      cantidad_recibida: Number(l.cantidad_recibida),
      precio: isPatron ? Number(l.precio_unitario) : 0, // financiero solo patrón
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom))

  // Productos del proveedor (para agregar líneas en borrador)
  let productosFournisseur: ProductoFournisseur[] = []
  if (pedido.fournisseur?.id) {
    const { data: prods } = await supabase
      .from('produits')
      .select('id, nom, unite, unite_achat, factor_achat, presentation, valeur_unitaire')
      .eq('actif', true)
      .eq('fournisseur_id', pedido.fournisseur.id)
      .order('nom')
    productosFournisseur = ((prods ?? []) as {
      id: string; nom: string; unite: string; unite_achat: string | null
      factor_achat: number | null; presentation: string | null; valeur_unitaire: number
    }[]).map((p) => ({
      id: p.id,
      nom: p.nom,
      unite: p.unite,
      uniteAchat: p.unite_achat ?? null,
      factor: p.factor_achat != null && Number(p.factor_achat) > 0 ? Number(p.factor_achat) : 1,
      presentation: p.presentation,
      precio: isPatron ? Number(p.valeur_unitaire) : 0,
    }))
  }

  const detail: PedidoDetailData = {
    id: pedido.id,
    numero: pedido.numero,
    statut: pedido.statut,
    note: pedido.note,
    createdAt: pedido.created_at,
    fournisseurNom: pedido.fournisseur?.nom ?? 'Proveedor eliminado',
    fournisseurContact: pedido.fournisseur?.contact ?? null,
  }

  return (
    <PedidoDetail
      pedido={detail}
      lineas={lineas}
      productosFournisseur={productosFournisseur}
      isPatron={isPatron}
      canCancel={isPatron}
    />
  )
}
