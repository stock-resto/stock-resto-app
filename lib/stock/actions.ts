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
