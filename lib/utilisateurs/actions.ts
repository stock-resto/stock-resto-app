'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/dal'

export type UsuarioState = { error?: string; success?: boolean }

const DOMAIN = 'app.misoenplace.com'

export async function crearEmpleado(
  _prev: UsuarioState,
  formData: FormData
): Promise<UsuarioState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede crear usuarios.' }

  const nom = String(formData.get('nom') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'cuisinier')

  if (!nom || !username || !password) return { error: 'Completa todos los campos.' }
  if (!/^[a-z0-9_]+$/.test(username))
    return { error: 'El usuario solo puede contener letras, números y guión bajo.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  if (!['gestionnaire', 'cuisinier'].includes(role)) return { error: 'Rol inválido.' }

  const admin = createAdminClient()
  const email = `${username}@${DOMAIN}`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      restaurant_id: profile.restaurant_id,
      nom,
      username,
      role,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Este nombre de usuario ya está en uso. Elige otro.' }
    }
    return { error: 'Error al crear el usuario.' }
  }

  if (!data.user) return { error: 'Error inesperado al crear el usuario.' }

  revalidatePath('/utilisateurs')
  return { success: true }
}

export async function actualizarEmpleado(
  _prev: UsuarioState,
  formData: FormData
): Promise<UsuarioState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede editar usuarios.' }

  const id = String(formData.get('id') ?? '').trim()
  const nom = String(formData.get('nom') ?? '').trim()
  const role = String(formData.get('role') ?? '')
  const actif = formData.get('actif') === 'true'

  if (!id || !nom) return { error: 'Datos inválidos.' }
  if (!['gestionnaire', 'cuisinier'].includes(role)) return { error: 'Rol inválido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ nom, role, actif })
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .neq('id', profile.id) // no puede editar su propia cuenta desde aquí

  if (error) return { error: 'Error al actualizar el usuario.' }

  revalidatePath('/utilisateurs')
  return { success: true }
}

export async function resetearPassword(
  _prev: UsuarioState,
  formData: FormData
): Promise<UsuarioState> {
  const profile = await getProfile()
  if (!profile) return { error: 'No autenticado.' }
  if (profile.role !== 'patron') return { error: 'Solo el dueño puede resetear contraseñas.' }

  const id = String(formData.get('id') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!id) return { error: 'ID inválido.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }

  // Verificar que el usuario pertenece al mismo restaurante
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .eq('restaurant_id', profile.restaurant_id)
    .single()

  if (!user) return { error: 'Usuario no encontrado.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) return { error: 'Error al cambiar la contraseña.' }

  return { success: true }
}
