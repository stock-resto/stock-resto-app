'use client'

import { useActionState, useState } from 'react'
import {
  login,
  requestPasswordReset,
  type LoginState,
  type ResetRequestState,
} from '@/lib/auth/actions'

type Mode = 'equipe' | 'patron'

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('equipe')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  )

  const isPatron = mode === 'patron'

  return (
    <>
    <form action={formAction} className="flex flex-col gap-5">
      {/* Bascule Equipo / Dueño */}
      <div className="flex gap-1 rounded-lg border border-border bg-secondary p-1">
        <ModeTab active={mode === 'equipe'} onClick={() => setMode('equipe')}>
          Equipo
        </ModeTab>
        <ModeTab active={mode === 'patron'} onClick={() => setMode('patron')}>
          Dueño
        </ModeTab>
      </div>

      <input type="hidden" name="mode" value={mode} />

      {/* Identifiant : username (équipe) ou email (patron) */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">
          {isPatron ? 'Correo electrónico' : 'Usuario'}
        </span>
        <input
          key={mode}
          name="identifier"
          type={isPatron ? 'email' : 'text'}
          autoComplete={isPatron ? 'email' : 'username'}
          autoCapitalize="none"
          spellCheck={false}
          placeholder={isPatron ? 'tu@correo.com' : 'carlos'}
          required
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/20"
        />
      </label>

      {/* Mot de passe */}
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/20"
        />
      </label>

      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? 'Entrando…' : 'Iniciar sesión'}
      </button>

      <button
        type="button"
        onClick={() => setForgotOpen(true)}
        className="text-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </form>

    {forgotOpen && (
      <ForgotModal isPatron={isPatron} onClose={() => setForgotOpen(false)} />
    )}
    </>
  )
}

function ForgotModal({
  isPatron,
  onClose,
}: {
  isPatron: boolean
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    {}
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold">Recuperar contraseña</h2>

        {isPatron ? (
          // Dueño : reset por correo
          state.sent ? (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
                contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95"
              >
                Entendido
              </button>
            </div>
          ) : (
            <form action={formAction} className="mt-4 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
              </p>
              <input
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="tu@correo.com"
                required
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/20"
              />
              {state.error && (
                <p className="text-sm font-medium text-destructive">{state.error}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={pending}
                  className="h-11 flex-1 rounded-lg border border-border text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-60"
                >
                  {pending ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </div>
            </form>
          )
        ) : (
          // Equipo : sin correo → el dueño se encarga
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Las cuentas del equipo no usan correo electrónico. Pídele a tu dueño que
              restablezca tu contraseña desde su panel de usuarios.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-95"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ' +
        (active
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
