'use client'

import { useEffect, useCallback, useState } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { registrarSortida, type ProductoState } from '@/lib/stock/actions'
import type { ProductoOption } from './entrada-modal'

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

export function SortieModal({ produits, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(registrarSortida, INIT)
  const [selectedId, setSelectedId] = useState('')

  const selected = produits.find((p) => p.id === selectedId) ?? null

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
        aria-label="Nueva salida"
        className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Nueva salida de stock</h2>
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
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring transition"
            >
              <option value="" disabled>
                Selecciona un producto…
              </option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            {selected && (
              <span className="text-[12px] text-muted-foreground">
                Stock actual:{' '}
                <strong className="font-mono">
                  {selected.stock_actuel} {selected.unite}
                </strong>
              </span>
            )}
          </Field>

          {/* Cantidad */}
          <Field label="Cantidad a retirar *">
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
              placeholder="Ej. Ajuste de inventario, merma…"
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
              className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? 'Registrando…' : 'Registrar salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
