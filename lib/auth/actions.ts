'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Domaine interne pour les comptes employés (jamais exposé à l'utilisateur).
// L'employé saisit seulement son username ; on reconstruit l'email ici.
// → impose un username GLOBALEMENT unique (vérifié à la création du compte).
const EMPLOYEE_EMAIL_DOMAIN = 'app.misoenplace.com'

export type LoginState = { error?: string }

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const mode = String(formData.get('mode') ?? 'equipe')
  const identifier = String(formData.get('identifier') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!identifier || !password) {
    return { error: 'Completa todos los campos.' }
  }

  // Patron : email réel. Employé : username → email interne.
  const email =
    mode === 'patron'
      ? identifier.toLowerCase()
      : `${identifier.toLowerCase()}@${EMPLOYEE_EMAIL_DOMAIN}`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Usuario o contraseña incorrectos.' }
  }

  // Le middleware redirige ensuite vers la page d'accueil selon le rôle.
  redirect('/')
}

export type SignupState = { error?: string; needsConfirm?: boolean }

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const restaurantNom = String(formData.get('restaurant_nom') ?? '').trim()
  const nom = String(formData.get('nom') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!restaurantNom || !nom || !email || !password) {
    return { error: 'Completa todos los campos.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const supabase = await createClient()
  // Les métadonnées sont lues par le trigger handle_new_user (crée restaurant + user patron).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nom, restaurant_nom: restaurantNom } },
  })

  if (error) {
    return { error: 'No se pudo crear la cuenta. Verifica el correo.' }
  }

  // Confirmation email désactivée → session immédiate ; sinon, on invite à confirmer.
  if (!data.session) {
    return { needsConfirm: true }
  }

  redirect('/')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
