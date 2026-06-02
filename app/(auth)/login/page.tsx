import Link from 'next/link'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const { reset } = await searchParams

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
            <p className="text-sm text-muted-foreground">Gestión de inventario</p>
          </div>
        </div>

        {reset === 'ok' && (
          <div className="mb-4 rounded-lg border border-[var(--ok)]/30 bg-[color-mix(in_oklch,var(--ok)_12%,transparent)] px-4 py-3 text-center text-sm font-medium text-[var(--ok)]">
            Contraseña actualizada. Inicia sesión con la nueva.
          </div>
        )}

        {/* Carte de connexion */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Eres dueño de un restaurante?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Crea tu cuenta
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Si eres del equipo y no puedes entrar, contacta al dueño.
        </p>
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
