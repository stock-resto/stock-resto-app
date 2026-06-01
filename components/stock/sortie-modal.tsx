'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { registrarSortida, type ProductoState } from '@/lib/stock/actions'
import type { ProductoOption } from './entrada-modal'

type Props = {
  produits: ProductoOption[]
  onClose: () => void
}

const INIT: ProductoState = {}

function stockTone(p: ProductoOption): 'ok' | 'warn' | 'out' {
  if (p.stock_actuel <= 0) return 'out'
  if (p.stock_actuel < p.stock_minimum) return 'warn'
  return 'ok'
}

export function SortieModal({ produits, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(registrarSortida, INIT)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? produits.filter((p) => p.nom.toLowerCase().includes(q)) : produits
  }, [produits, search])

  const selectedCount = Object.values(quantities).filter((q) => Number(q) > 0).length

  const lignesJson = JSON.stringify(
    Object.entries(quantities)
      .filter(([, q]) => Number(q) > 0)
      .map(([produit_id, q]) => ({ produit_id, quantite: Number(q) }))
  )

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
        className="flex w-full max-w-[560px] max-h-[88vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
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

        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="lignes" value={lignesJson} />

          {/* Search */}
          <div className="shrink-0 border-b border-border px-4 py-2.5">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Icon name="search" size={15} className="text-muted-foreground/60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center border-b border-border bg-card px-4 py-2">
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Producto
              </span>
              <span className="w-28 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Stock actual
              </span>
              <span className="w-28 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Cantidad
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground/60">
                Sin resultados
              </div>
            ) : (
              filtered.map((p) => {
                const qty = quantities[p.id] ?? ''
                const hasQty = Number(qty) > 0
                const tone = stockTone(p)
                const stockCls =
                  tone === 'out'
                    ? 'text-destructive'
                    : tone === 'warn'
                      ? 'text-[var(--warn)]'
                      : 'text-muted-foreground'

                return (
                  <div
                    key={p.id}
                    className={
                      'flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 transition ' +
                      (hasQty ? 'bg-destructive/5' : 'hover:bg-secondary')
                    }
                  >
                    <span className="flex-1 text-sm font-medium">{p.nom}</span>
                    <span className={`w-28 text-right font-mono text-[13px] font-medium ${stockCls}`}>
                      {p.stock_actuel} {p.unite}
                    </span>
                    <div className="flex w-28 items-center justify-end gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={qty}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        placeholder="—"
                        className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-right text-sm font-mono outline-none focus:border-ring transition"
                      />
                      <span className="text-[11px] text-muted-foreground/70">{p.unite}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Nota + footer */}
          <div className="shrink-0 border-t border-border px-5 py-4 flex flex-col gap-3">
            <textarea
              name="notes"
              rows={2}
              placeholder="Nota (opcional) — Ej. Ajuste de inventario, merma…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring transition"
            />

            {state.error && (
              <p className="text-[13px] text-destructive">{state.error}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                {selectedCount > 0 ? (
                  <>{selectedCount} producto{selectedCount > 1 ? 's' : ''} con cantidad</>
                ) : (
                  'Ningún producto seleccionado'
                )}
              </span>
              <div className="flex gap-3">
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
                  disabled={isPending || selectedCount === 0}
                  className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Registrando…' : 'Registrar salida'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
