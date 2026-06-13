'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'

export type PedidoState = { error?: string; success?: boolean; pedidoId?: string }

// Snapshot par produit pour figer la ligne de pedido (prix + unité d'achat).
// L'unité d'achat est snapshottée comme le prix : la ligne reste juste même si
// le produit est modifié plus tard.
type ProductoDatos = { precio: number; unite_achat: string | null; factor_achat: number | null }

async function datosDeProductos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Record<string, ProductoDatos>> {
  if (ids.length === 0) return {}
  const { data } = await supabase
    .from('produits')
    .select('id, valeur_unitaire, unite_achat, factor_achat')
    .in('id', ids)
  const map: Record<string, ProductoDatos> = {}
  for (const p of data ?? []) {
    map[p.id] = {
      precio: Number(p.valeur_unitaire) || 0,
      unite_achat: p.unite_achat ?? null,
      factor_achat: p.factor_achat != null ? Number(p.factor_achat) : null,
    }
  }
  return map
}

// ── Création groupée depuis les alertes : un pedido (brouillon) par fournisseur ──
export async function crearPedidosDesdeAlertas(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  type Grupo = { fournisseur_id: string; items: { produit_id: string; cantidad: number }[] }
  let grupos: Grupo[] = []
  try {
    grupos = JSON.parse((formData.get('grupos') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }

  const gruposValidos = grupos
    .map((g) => ({
      fournisseur_id: g.fournisseur_id,
      items: (g.items ?? []).filter((it) => it.produit_id && it.cantidad > 0),
    }))
    .filter((g) => g.fournisseur_id && g.items.length > 0)

  if (gruposValidos.length === 0) return { error: 'Selecciona al menos un producto.' }

  const supabase = await createClient()
  const datos = await datosDeProductos(
    supabase,
    gruposValidos.flatMap((g) => g.items.map((it) => it.produit_id))
  )

  for (const g of gruposValidos) {
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        restaurant_id: profile.restaurant_id,
        fournisseur_id: g.fournisseur_id,
        created_by: profile.id,
      })
      .select('id')
      .single()

    if (pedidoError || !pedido) return { error: 'Error al crear el pedido.' }

    const { error: lineasError } = await supabase.from('pedido_lineas').insert(
      g.items.map((it) => ({
        pedido_id: pedido.id,
        produit_id: it.produit_id,
        cantidad_pedida: it.cantidad,
        precio_unitario: datos[it.produit_id]?.precio ?? 0,
        unite_achat: datos[it.produit_id]?.unite_achat ?? null,
        factor_achat: datos[it.produit_id]?.factor_achat ?? null,
      }))
    )
    if (lineasError) return { error: 'Error al guardar los productos.' }
  }

  revalidatePath('/pedidos')
  return { success: true }
}

// ── Création manuelle d'un pedido pour un fournisseur ──
export async function crearPedido(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const fournisseur_id = String(formData.get('fournisseur_id') ?? '').trim()
  if (!fournisseur_id) return { error: 'Selecciona un proveedor.' }
  const note = (formData.get('note') as string) || null

  let lineas: { produit_id: string; cantidad: number }[] = []
  try {
    lineas = JSON.parse((formData.get('lineas') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }
  const valid = lineas.filter((l) => l.produit_id && l.cantidad > 0)
  if (valid.length === 0) return { error: 'Agrega al menos un producto.' }

  const supabase = await createClient()
  const datos = await datosDeProductos(supabase, valid.map((l) => l.produit_id))

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      restaurant_id: profile.restaurant_id,
      fournisseur_id,
      note,
      created_by: profile.id,
    })
    .select('id')
    .single()
  if (pedidoError || !pedido) return { error: 'Error al crear el pedido.' }

  const { error: lineasError } = await supabase.from('pedido_lineas').insert(
    valid.map((l) => ({
      pedido_id: pedido.id,
      produit_id: l.produit_id,
      cantidad_pedida: l.cantidad,
      precio_unitario: datos[l.produit_id]?.precio ?? 0,
      unite_achat: datos[l.produit_id]?.unite_achat ?? null,
      factor_achat: datos[l.produit_id]?.factor_achat ?? null,
    }))
  )
  if (lineasError) return { error: 'Error al guardar los productos.' }

  revalidatePath('/pedidos')
  return { success: true, pedidoId: pedido.id }
}

// ── Édition d'un brouillon : remplace les lignes + note ──
export async function editarPedido(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const id = String(formData.get('id') ?? '').trim()
  const note = (formData.get('note') as string) || null

  let lineas: { produit_id: string; cantidad: number }[] = []
  try {
    lineas = JSON.parse((formData.get('lineas') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }
  const valid = lineas.filter((l) => l.produit_id && l.cantidad > 0)
  if (valid.length === 0) return { error: 'Agrega al menos un producto.' }

  const supabase = await createClient()

  // Garde-fou : seulement les brouillons sont éditables
  const { error: noteError } = await supabase
    .from('pedidos')
    .update({ note })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .eq('statut', 'brouillon')
  if (noteError) return { error: 'Error al actualizar el pedido.' }

  const datos = await datosDeProductos(supabase, valid.map((l) => l.produit_id))

  const { error: deleteError } = await supabase
    .from('pedido_lineas')
    .delete()
    .eq('pedido_id', id)
  if (deleteError) return { error: 'Error al actualizar los productos.' }

  const { error: insertError } = await supabase.from('pedido_lineas').insert(
    valid.map((l) => ({
      pedido_id: id,
      produit_id: l.produit_id,
      cantidad_pedida: l.cantidad,
      precio_unitario: datos[l.produit_id]?.precio ?? 0,
      unite_achat: datos[l.produit_id]?.unite_achat ?? null,
      factor_achat: datos[l.produit_id]?.factor_achat ?? null,
    }))
  )
  if (insertError) return { error: 'Error al guardar los productos.' }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${id}`)
  return { success: true }
}

// ── Marquer un brouillon comme envoyé ──
export async function marcarEnviado(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ statut: 'enviada', enviada_at: new Date().toISOString() })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .eq('statut', 'brouillon')
  if (error) return { error: 'Error al enviar el pedido.' }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${id}`)
  return { success: true }
}

// ── Réception (possible plusieurs fois) : crée une entrée stock par ligne reçue ──
export async function registrarRecepcion(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const pedido_id = String(formData.get('pedido_id') ?? '').trim()
  if (!pedido_id) return { error: 'ID inválido.' }

  let recepciones: { linea_id: string; recibir: number }[] = []
  try {
    recepciones = JSON.parse((formData.get('recepciones') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }
  const aRecibir = recepciones.filter((r) => r.linea_id && r.recibir > 0)
  if (aRecibir.length === 0) return { error: 'Indica al menos una cantidad recibida.' }

  const supabase = await createClient()

  // Sécurité : le pedido doit appartenir au resto et être 'enviada'
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, numero, statut, restaurant_id')
    .eq('id', pedido_id)
    .eq('restaurant_id', profile.restaurant_id)
    .single()
  if (!pedido || pedido.statut !== 'enviada') return { error: 'Pedido no recepcionable.' }

  // Récupère les lignes concernées (produit + cumul actuel)
  const { data: lineas } = await supabase
    .from('pedido_lineas')
    .select('id, produit_id, cantidad_recibida')
    .eq('pedido_id', pedido_id)
    .in('id', aRecibir.map((r) => r.linea_id))
  if (!lineas || lineas.length === 0) return { error: 'Líneas no encontradas.' }

  const byId = new Map(lineas.map((l) => [l.id, l]))

  // 1. Une entrée stock par ligne reçue (le trigger on_mouvement_insert met à jour stock_actuel)
  const mouvements = aRecibir
    .map((r) => {
      const l = byId.get(r.linea_id)
      if (!l) return null
      return {
        restaurant_id: profile.restaurant_id,
        produit_id: l.produit_id,
        user_id: profile.id,
        type: 'entree' as const,
        quantite: r.recibir,
        notes: `Recepción PED-${pedido.numero}`,
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  const { error: movError } = await supabase.from('mouvements').insert(mouvements)
  if (movError) return { error: 'Error al registrar la entrada de stock.' }

  // 2. Incrémente le cumul reçu de chaque ligne
  for (const r of aRecibir) {
    const l = byId.get(r.linea_id)
    if (!l) continue
    await supabase
      .from('pedido_lineas')
      .update({ cantidad_recibida: Number(l.cantidad_recibida) + r.recibir })
      .eq('id', r.linea_id)
  }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedido_id}`)
  revalidatePath('/mouvements')
  revalidatePath('/stock')
  return { success: true }
}

// ── Clôturer le pedido (réception complète) ──
export async function cerrarPedido(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ statut: 'recibida', recibida_at: new Date().toISOString() })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .eq('statut', 'enviada')
  if (error) return { error: 'Error al cerrar el pedido.' }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${id}`)
  return { success: true }
}

// ── Annuler (patron uniquement) ──
export async function cancelarPedido(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede cancelar.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ statut: 'cancelada', cancelada_at: new Date().toISOString() })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .in('statut', ['brouillon', 'enviada'])
  if (error) return { error: 'Error al cancelar el pedido.' }

  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${id}`)
  return { success: true }
}

// ── Supprimer un brouillon ──
export async function eliminarPedido(
  _prev: PedidoState,
  formData: FormData
): Promise<PedidoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .eq('statut', 'brouillon')
  if (error) return { error: 'Error al eliminar el pedido.' }

  revalidatePath('/pedidos')
  return { success: true }
}
