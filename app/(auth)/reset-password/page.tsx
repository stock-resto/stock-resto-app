import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './reset-password-form'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* En-tête de marque */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BoxMark />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mise en Place</h1>
            <p className="text-sm text-muted-foreground">Nueva contraseña</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {user ? (
            <ResetPasswordForm />
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                El enlace expiró o no es válido. Solicita uno nuevo desde la página de inicio de
                sesión.
              </p>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95"
              >
                Volver al inicio
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BoxMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" />
    </svg>
  )
}
