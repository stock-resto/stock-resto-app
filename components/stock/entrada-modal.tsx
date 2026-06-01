'use client'

import { useEffect, useCallback } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { registrarEntrada, type ProductoState } from '@/lib/stock/actions'

export type ProductoOption = {
  id: string
  nom: string
  unite: string
  stock_actuel: number
}

type Props = {
  produits: ProductoOption[]
  onClose: () => void
}

const INIT: ProductoState = {}

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

export function EntradaModal({ produits, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(registrarEntrada, INIT)

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

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
        aria-label="Nueva entrada"
        className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Nueva entrada de stock</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40"
            aria-label="Cerrar"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-4 px-5 py-5">
          {/* Producto */}
          <Field label="Producto *">
            <select
              name="produit_id"
              required
              defaultValue=""
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring transition"
            >
              <option value="" disabled>
                Selecciona un producto…
              </option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} — {p.stock_actuel} {p.unite} en stock
                </option>
              ))}
            </select>
          </Field>

          {/* Cantidad */}
          <Field label="Cantidad recibida *">
            <input
              type="number"
              name="quantite"
              required
              min="0.01"
              step="0.01"
              placeholder="0"
              className={`${inputCls} font-mono`}
            />
          </Field>

          {/* Nota */}
          <Field label="Nota (opcional)">
            <textarea
              name="notes"
              rows={2}
              placeholder="Ej. Factura #1234, proveedor sustituto…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring transition"
            />
          </Field>

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
              {isPending ? 'Registrando…' : 'Registrar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
