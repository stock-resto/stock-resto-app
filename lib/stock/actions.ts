'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'

export type ProductoState = { error?: string; success?: boolean }

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

  const payload = {
    categorie_id: (formData.get('categorie_id') as string) || null,
    fournisseur_id: (formData.get('fournisseur_id') as string) || null,
    nom,
    presentation: (formData.get('presentation') as string) || null,
    unite,
    stock_minimum: Number(formData.get('stock_minimum') ?? 0),
    stock_maximum: formData.get('stock_maximum') ? Number(formData.get('stock_maximum')) : null,
    valeur_unitaire: Number(formData.get('valeur_unitaire') ?? 0),
    date_peremption: (formData.get('date_peremption') as string) || null,
  }

  const supabase = await createClient()

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

  revalidatePath('/entrees')
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

  revalidatePath('/sorties')
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

  revalidatePath('/entrees')
  revalidatePath('/sorties')
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

  revalidatePath('/entrees')
  revalidatePath('/sorties')
  revalidatePath('/stock')
  return { success: true }
}
