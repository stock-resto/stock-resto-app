'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { registrarEntrada, type ProductoState } from '@/lib/stock/actions'
import { toBase, tieneUso } from '@/lib/units'

export type ProductoOption = {
  id: string
  nom: string
  unite: string
  unite_uso: string | null
  factor_uso: number | null
  stock_actuel: number
  stock_minimum: number
}

type Props = {
  produits: ProductoOption[]
  onClose: () => void
}

const INIT: ProductoState = {}

export function EntradaModal({ produits, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(registrarEntrada, INIT)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  // Unité de saisie par produit : 'base' (kg) ou 'uso' (sac). Défaut : base.
  const [units, setUnits] = useState<Record<string, 'base' | 'uso'>>({})
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? produits.filter((p) => p.nom.toLowerCase().includes(q)) : produits
  }, [produits, search])

  const selectedCount = Object.values(quantities).filter((q) => Number(q) > 0).length

  // Quantité convertie en unité de base (kg) selon l'unité de saisie choisie.
  const lignesJson = JSON.stringify(
    Object.entries(quantities)
      .filter(([, q]) => Number(q) > 0)
      .map(([produit_id, q]) => {
        const p = produits.find((x) => x.id === produit_id)
        return {
          produit_id,
          quantite: toBase(Number(q), units[produit_id] ?? 'base', p?.factor_uso ?? null),
        }
      })
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
        aria-label="Nueva entrada"
        className="flex w-full max-w-[560px] max-h-[88vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
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

          {/* Lista de productos (scrollable) */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Cabecera de columnas */}
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
                const unit = units[p.id] ?? 'base'
                const conUso = tieneUso(p)
                return (
                  <div
                    key={p.id}
                    className={
                      'flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 transition ' +
                      (hasQty ? 'bg-[color-mix(in_oklch,var(--ok)_6%,transparent)]' : 'hover:bg-secondary')
                    }
                  >
                    <span className="flex-1 text-sm font-medium">{p.nom}</span>
                    <span className="w-28 text-right font-mono text-[13px] text-muted-foreground">
                      {p.stock_actuel} {p.unite}
                    </span>
                    <div className="flex w-32 flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1.5">
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
                        {conUso ? (
                          <button
                            type="button"
                            onClick={() =>
                              setUnits((prev) => ({ ...prev, [p.id]: unit === 'uso' ? 'base' : 'uso' }))
                            }
                            className="min-w-[42px] rounded-md border border-border px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                            title="Cambiar unidad"
                          >
                            {unit === 'uso' ? p.unite_uso : p.unite}
                          </button>
                        ) : (
                          <span className="min-w-[42px] text-[11px] text-muted-foreground/70">{p.unite}</span>
                        )}
                      </div>
                      {conUso && unit === 'uso' && hasQty && (
                        <span className="text-[10px] text-muted-foreground/60">
                          = {toBase(Number(qty), 'uso', p.factor_uso)} {p.unite}
                        </span>
                      )}
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
              placeholder="Nota (opcional) — Ej. Factura #1234…"
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
                  className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Registrando…' : 'Registrar entrada'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
