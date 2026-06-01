'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'

export type DemandaState = { error?: string; success?: boolean }

export async function crearDemanda(
  _prev: DemandaState,
  formData: FormData
): Promise<DemandaState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }

  const note = (formData.get('note') as string) || null

  let lignes: { produit_id: string; quantite: number }[] = []
  try {
    lignes = JSON.parse((formData.get('lignes') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }

  const valid = lignes.filter((l) => l.produit_id && l.quantite > 0)
  if (valid.length === 0) return { error: 'Agrega al menos un producto.' }

  const supabase = await createClient()

  const { data: demande, error: demandeError } = await supabase
    .from('demandes')
    .insert({
      restaurant_id: profile.restaurant_id,
      cuisinier_id: profile.id,
      note,
    })
    .select('id')
    .single()

  if (demandeError || !demande) return { error: 'Error al crear la solicitud.' }

  const { error: lignesError } = await supabase.from('demande_lignes').insert(
    valid.map((l) => ({
      demande_id: demande.id,
      produit_id: l.produit_id,
      quantite: l.quantite,
    }))
  )

  if (lignesError) return { error: 'Error al guardar los productos.' }

  revalidatePath('/demandes')
  return { success: true }
}

export async function editarDemanda(
  _prev: DemandaState,
  formData: FormData
): Promise<DemandaState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede editar solicitudes.' }

  const id = String(formData.get('id') ?? '').trim()
  const note = (formData.get('note') as string) || null

  let lignes: { produit_id: string; quantite: number }[] = []
  try {
    lignes = JSON.parse((formData.get('lignes') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }

  const valid = lignes.filter((l) => l.produit_id && l.quantite > 0)
  if (valid.length === 0) return { error: 'Agrega al menos un producto.' }

  const supabase = await createClient()

  const { error: noteError } = await supabase
    .from('demandes')
    .update({ note })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .eq('statut', 'en_attente')
  if (noteError) return { error: 'Error al actualizar la solicitud.' }

  // Reemplazar las líneas: borrar las existentes e insertar las nuevas
  const { error: deleteError } = await supabase
    .from('demande_lignes')
    .delete()
    .eq('demande_id', id)
  if (deleteError) return { error: 'Error al actualizar los productos.' }

  const { error: insertError } = await supabase.from('demande_lignes').insert(
    valid.map((l) => ({
      demande_id: id,
      produit_id: l.produit_id,
      quantite: l.quantite,
    }))
  )
  if (insertError) return { error: 'Error al guardar los productos.' }

  revalidatePath('/demandes')
  return { success: true }
}

export async function aprobarDemanda(
  _prev: DemandaState,
  formData: FormData
): Promise<DemandaState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('demandes')
    .update({ statut: 'approuvee', gestionnaire_id: profile.id })
    .eq('id', id)
    .eq('statut', 'en_attente')

  if (error) return { error: 'Error al aprobar.' }

  revalidatePath('/demandes')
  return { success: true }
}

export async function rechazarDemanda(
  _prev: DemandaState,
  formData: FormData
): Promise<DemandaState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('demandes')
    .update({ statut: 'rejetee', gestionnaire_id: profile.id })
    .eq('id', id)
    .eq('statut', 'en_attente')

  if (error) return { error: 'Error al rechazar.' }

  revalidatePath('/demandes')
  return { success: true }
}

export async function entregarDemanda(
  _prev: DemandaState,
  formData: FormData
): Promise<DemandaState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role === 'cuisinier') return { error: 'Sin permiso.' }

  const demande_id = String(formData.get('demande_id') ?? '').trim()
  if (!demande_id) return { error: 'ID inválido.' }

  let livrees: { ligne_id: string; quantite_livree: number }[] = []
  try {
    livrees = JSON.parse((formData.get('livrees') as string) || '[]')
  } catch {
    return { error: 'Datos inválidos.' }
  }

  const supabase = await createClient()

  // Actualizar quantite_livree por línea ANTES de cambiar el estatus
  // (el trigger on_demande_update usa estos valores al crear las salidas)
  for (const l of livrees) {
    await supabase
      .from('demande_lignes')
      .update({ quantite_livree: l.quantite_livree })
      .eq('id', l.ligne_id)
  }

  // Cambio de estatus → dispara on_demande_update → crea sorties de stock
  const { error } = await supabase
    .from('demandes')
    .update({ statut: 'livree', gestionnaire_id: profile.id })
    .eq('id', demande_id)
    .eq('statut', 'approuvee')

  if (error) return { error: 'Error al marcar como entregada.' }

  revalidatePath('/demandes')
  revalidatePath('/sorties')
  revalidatePath('/stock')
  return { success: true }
}
