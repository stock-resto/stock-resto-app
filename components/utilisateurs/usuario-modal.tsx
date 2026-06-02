'use client'

import { useActionState, useEffect, useCallback, useState } from 'react'
import { Icon } from '@/components/icon'
import {
  crearEmpleado,
  actualizarEmpleado,
  resetearPassword,
  type UsuarioState,
} from '@/lib/utilisateurs/actions'
import type { UsuarioRow } from './usuarios-list'

type Props =
  | { mode: 'create'; usuario?: never; onClose: () => void }
  | { mode: 'edit'; usuario: UsuarioRow; onClose: () => void }

const INIT: UsuarioState = {}

const inputCls =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring transition'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function UsuarioModal({ mode, usuario, onClose }: Props) {
  const [createState, createAction, createPending] = useActionState(crearEmpleado, INIT)
  const [editState, editAction, editPending] = useActionState(actualizarEmpleado, INIT)
  const [resetState, resetAction, resetPending] = useActionState(resetearPassword, INIT)
  const [showReset, setShowReset] = useState(false)
  const [actif, setActif] = useState(usuario?.actif ?? true)

  const isPending = createPending || editPending || resetPending
  const state = mode === 'create' ? createState : editState
  const formAction = mode === 'create' ? createAction : editAction
  const title = mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'

  useEffect(() => {
    if (createState.success || editState.success) onClose()
  }, [createState.success, editState.success, onClose])

  useEffect(() => {
    if (resetState.success) setShowReset(false)
  }, [resetState.success])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isPending, onClose])

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isPending) onClose()
    },
    [isPending, onClose]
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={handleBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        {/* Formulario principal */}
        <form action={formAction} className="flex flex-col gap-4 px-5 py-5">
          {mode === 'edit' && <input type="hidden" name="id" value={usuario.id} />}
          {mode === 'edit' && <input type="hidden" name="actif" value={String(actif)} />}

          <Field label="Nombre *">
            <input
              name="nom"
              required
              defaultValue={usuario?.nom ?? ''}
              placeholder="Ej. Carlos López"
              className={inputCls}
            />
          </Field>

          {mode === 'create' && (
            <Field label="Usuario *">
              <input
                name="username"
                required
                placeholder="ej. carlos (solo letras, números, _)"
                className={inputCls}
              />
              <span className="text-[11.5px] text-muted-foreground">
                Iniciará sesión con este nombre de usuario
              </span>
            </Field>
          )}

          <Field label="Rol *">
            <select
              name="role"
              defaultValue={usuario?.role ?? 'cuisinier'}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring transition"
            >
              <option value="cuisinier">Cocinero</option>
              <option value="gestionnaire">Encargado</option>
            </select>
          </Field>

          {mode === 'create' && (
            <Field label="Contraseña temporal *">
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className={inputCls}
              />
            </Field>
          )}

          {mode === 'edit' && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
              <div>
                <p className="text-sm font-medium">Cuenta activa</p>
                <p className="text-[12px] text-muted-foreground">
                  {actif ? 'El usuario puede iniciar sesión' : 'El usuario no puede acceder'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActif((v) => !v)}
                className={
                  'relative h-6 w-11 shrink-0 rounded-full transition ' +
                  (actif ? 'bg-primary' : 'bg-border')
                }
                aria-label="Toggle activo"
              >
                <span
                  className={
                    'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ' +
                    (actif ? 'translate-x-5' : 'translate-x-0.5')
                  }
                />
              </button>
            </div>
          )}

          {state.error && (
            <p className="text-[13px] text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-9 rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar'}
            </button>
          </div>
        </form>

        {/* Sección reset contraseña (solo edit) */}
        {mode === 'edit' && (
          <div className="border-t border-border px-5 py-4">
            {!showReset ? (
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                Cambiar contraseña
              </button>
            ) : (
              <form action={resetAction} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={usuario.id} />
                <Field label="Nueva contraseña">
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className={inputCls}
                  />
                </Field>
                {resetState.error && (
                  <p className="text-[13px] text-destructive">{resetState.error}</p>
                )}
                {resetState.success && (
                  <p className="text-[13px] text-[var(--ok)]">Contraseña actualizada.</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    disabled={resetPending}
                    className="h-9 flex-1 rounded-lg border border-border text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetPending}
                    className="h-9 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {resetPending ? 'Cambiando…' : 'Cambiar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
