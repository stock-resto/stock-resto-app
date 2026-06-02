'use client'

import { useActionState } from 'react'
import { updatePassword, type UpdatePasswordState } from '@/lib/auth/actions'

const inputCls =
  'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/20'

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<UpdatePasswordState, FormData>(
    updatePassword,
    {}
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Nueva contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          required
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-foreground">Confirmar contraseña</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="Repite la contraseña"
          required
          className={inputCls}
        />
      </label>

      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
