'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup, type SignupState } from '@/lib/auth/actions'

const inputCls =
  'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/20'

export function SignupForm() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signup,
    {}
  )

  if (state.needsConfirm) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-foreground">
          Revisa tu correo para confirmar tu cuenta, luego{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            inicia sesión
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Nombre del restaurante">
        <input
          name="restaurant_nom"
          type="text"
          placeholder="La Cocina de Ana"
          required
          className={inputCls}
        />
      </Field>

      <Field label="Tu nombre">
        <input name="nom" type="text" placeholder="Ana López" required className={inputCls} />
      </Field>

      <Field label="Correo electrónico">
        <input
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="tu@correo.com"
          required
          className={inputCls}
        />
      </Field>

      <Field label="Contraseña">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          required
          className={inputCls}
        />
      </Field>

      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  )
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
