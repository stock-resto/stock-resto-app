'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'

export type ProductoState = { error?: string; success?: boolean }

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// Cherche une catégorie/fournisseur par nom (insensible casse/espaces) ou la crée.
// Retourne l'id, ou null si le nom est vide. Lève une erreur si la création échoue.
async function findOrCreateByName(
  supabase: SupabaseClient,
  table: 'categories' | 'fournisseurs',
  restaurantId: string,
  rawName: string | null
): Promise<{ id: string | null; error?: string }> {
  const name = (rawName ?? '').trim()
  if (!name) return { id: null }

  // Échappe les jokers ilike pour faire une égalité insensible à la casse
  const pattern = name.replace(/[%_\\]/g, '\\$&')
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('restaurant_id', restaurantId)
    .ilike('nom', pattern)
    .limit(1)
    .maybeSingle()

  if (existing) return { id: existing.id }

  const { data: created, error } = await supabase
    .from(table)
    .insert({ restaurant_id: restaurantId, nom: name })
    .select('id')
    .single()

  if (error || !created) {
    const label = table === 'categories' ? 'la categoría' : 'el proveedor'
    return { id: null, error: `Error al crear ${label}.` }
  }
  return { id: created.id }
}

export async function upsertProducto(
  _prev: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const nom = String(formData.get('nom') ?? '').trim()
  const unite = String(formData.get('unite') ?? '').trim()
  if (!nom || !unite) return { error: 'Nombre y unidad son obligatorios.' }

  const id = (formData.get('id') as string | null) || null

  const supabase = await createClient()

  // Catégorie & fournisseur : créés à la volée si le nom n'existe pas
  const cat = await findOrCreateByName(
    supabase, 'categories', profile.restaurant_id, formData.get('categorie_nom') as string | null
  )
  if (cat.error) return { error: cat.error }
  const four = await findOrCreateByName(
    supabase, 'fournisseurs', profile.restaurant_id, formData.get('fournisseur_nom') as string | null
  )
  if (four.error) return { error: four.error }

  // Présentations optionnelles : vide => produit mono-unité. Les facteurs sont
  // en unité de base (mesure) : nb d'unités de base dans 1 présentation.
  const uniteAchat = String(formData.get('unite_achat') ?? '').trim() || null
  const factorAchatRaw = Number(formData.get('factor_achat'))
  const factorAchat = uniteAchat && factorAchatRaw > 0 ? factorAchatRaw : null

  const uniteUso = String(formData.get('unite_uso') ?? '').trim() || null
  const factorUsoRaw = Number(formData.get('factor_uso'))
  const factorUso = uniteUso && factorUsoRaw > 0 ? factorUsoRaw : null

  const payload = {
    categorie_id: cat.id,
    fournisseur_id: four.id,
    nom,
    unite,
    unite_achat: uniteAchat,
    factor_achat: factorAchat,
    unite_uso: uniteUso,
    factor_uso: factorUso,
    stock_minimum: Number(formData.get('stock_minimum') ?? 0),
    stock_maximum: formData.get('stock_maximum') ? Number(formData.get('stock_maximum')) : null,
    valeur_unitaire: Number(formData.get('valeur_unitaire') ?? 0),
    date_peremption: (formData.get('date_peremption') as string) || null,
  }

  if (id) {
    const { error } = await supabase
      .from('produits')
      .update(payload)
      .eq('id', id)
      .eq('restaurant_id', profile.restaurant_id)
    if (error) return { error: 'Error al actualizar el producto.' }
  } else {
    const { error } = await supabase.from('produits').insert({
      ...payload,
      restaurant_id: profile.restaurant_id,
      stock_actuel: Number(formData.get('stock_actuel') ?? 0),
    })
    if (error) return { error: 'Error al crear el producto.' }
  }

  revalidatePath('/stock')
  return { success: true }
}

export async function desactivarProducto(
  _prev: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede desactivar productos.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produits')
    .update({ actif: false })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
  if (error) return { error: 'Error al desactivar.' }

  revalidatePath('/stock')
  return { success: true }
}

export async function registrarEntrada(
  _prev: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const notes = (formData.get('notes') as string) || null

  let lignes: { produit_id: string; quantite: number }[] = []
  try {
    lignes = JSON.parse((formData.get('lignes') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }

  const valid = lignes.filter((l) => l.produit_id && l.quantite > 0)
  if (valid.length === 0) return { error: 'Ingresa al menos una cantidad.' }

  const supabase = await createClient()
  const { error } = await supabase.from('mouvements').insert(
    valid.map((l) => ({
      restaurant_id: profile.restaurant_id,
      produit_id: l.produit_id,
      user_id: profile.id,
      type: 'entree',
      quantite: l.quantite,
      notes,
    }))
  )
  if (error) return { error: 'Error al registrar las entradas.' }

  revalidatePath('/mouvements')
  revalidatePath('/stock')
  return { success: true }
}

export async function registrarSortida(
  _prev: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const notes = (formData.get('notes') as string) || null

  let lignes: { produit_id: string; quantite: number }[] = []
  try {
    lignes = JSON.parse((formData.get('lignes') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }

  const valid = lignes.filter((l) => l.produit_id && l.quantite > 0)
  if (valid.length === 0) return { error: 'Ingresa al menos una cantidad.' }

  const supabase = await createClient()
  const { error } = await supabase.from('mouvements').insert(
    valid.map((l) => ({
      restaurant_id: profile.restaurant_id,
      produit_id: l.produit_id,
      user_id: profile.id,
      type: 'sortie',
      quantite: l.quantite,
      notes,
    }))
  )
  if (error) return { error: 'Error al registrar las salidas.' }

  revalidatePath('/mouvements')
  revalidatePath('/stock')
  return { success: true }
}

export async function editarMovimiento(
  _prev: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede corregir movimientos.' }

  const id = String(formData.get('id') ?? '').trim()
  const produit_id = String(formData.get('produit_id') ?? '').trim()
  const type = String(formData.get('type') ?? '')
  const oldQuantite = Number(formData.get('old_quantite'))
  const newQuantite = Number(formData.get('quantite'))
  const notes = (formData.get('notes') as string) || null

  if (!id || !produit_id) return { error: 'Datos inválidos.' }
  if (!newQuantite || newQuantite <= 0) return { error: 'La cantidad debe ser mayor a 0.' }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('mouvements')
    .update({ quantite: newQuantite, notes })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
  if (updateError) return { error: 'Error al actualizar el movimiento.' }

  // Ajuste del stock según el delta
  const delta = newQuantite - oldQuantite
  if (delta !== 0) {
    const { data: prod } = await supabase
      .from('produits')
      .select('stock_actuel')
      .eq('id', produit_id)
      .eq('restaurant_id', profile.restaurant_id)
      .single()

    if (prod) {
      const ajuste = type === 'entree' ? delta : -delta
      await supabase
        .from('produits')
        .update({ stock_actuel: prod.stock_actuel + ajuste })
        .eq('id', produit_id)
        .eq('restaurant_id', profile.restaurant_id)
    }
  }

  revalidatePath('/mouvements')
  revalidatePath('/stock')
  return { success: true }
}

export async function eliminarMovimiento(
  _prev: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede eliminar movimientos.' }

  const id = String(formData.get('id') ?? '').trim()
  const produit_id = String(formData.get('produit_id') ?? '').trim()
  const type = String(formData.get('type') ?? '')
  const quantite = Number(formData.get('quantite'))

  if (!id || !produit_id) return { error: 'Datos inválidos.' }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('mouvements')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
  if (deleteError) return { error: 'Error al eliminar el movimiento.' }

  // Revertir el efecto en el stock
  const { data: prod } = await supabase
    .from('produits')
    .select('stock_actuel')
    .eq('id', produit_id)
    .eq('restaurant_id', profile.restaurant_id)
    .single()

  if (prod) {
    const ajuste = type === 'entree' ? -quantite : quantite
    await supabase
      .from('produits')
      .update({ stock_actuel: prod.stock_actuel + ajuste })
      .eq('id', produit_id)
      .eq('restaurant_id', profile.restaurant_id)
  }

  revalidatePath('/mouvements')
  revalidatePath('/stock')
  return { success: true }
}
