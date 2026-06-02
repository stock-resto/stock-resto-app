import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { UsuariosList, type UsuarioRow } from '@/components/utilisateurs/usuarios-list'

export default async function UtilisateursPage() {
  const supabase = await createClient()
  const profile = await getProfile()

  const { data: usuarios } = await supabase
    .from('users')
    .select('id, nom, username, role, actif, created_at')
    .order('created_at', { ascending: true })

  return (
    <UsuariosList
      usuarios={(usuarios ?? []) as UsuarioRow[]}
      patronId={profile!.id}
    />
  )
}
