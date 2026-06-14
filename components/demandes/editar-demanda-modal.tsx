'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { editarDemanda, type DemandaState } from '@/lib/demandes/actions'
import { toBase, tieneUso, baseToUso, displayQty } from '@/lib/units'
import type { ProductoOption } from '@/components/stock/entrada-modal'
import type { DemandeRow } from './demandes-list'

type Props = {
  demande: DemandeRow
  produits: ProductoOption[]
  onClose: () => void
}

const INIT: DemandaState = {}

export function EditarDemandaModal({ demande, produits, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(editarDemanda, INIT)
  const [search, setSearch] = useState('')
  const [units, setUnits] = useState<Record<string, 'base' | 'uso'>>({})

  const unitOf = (p: ProductoOption): 'base' | 'uso' =>
    units[p.id] ?? (tieneUso(p) ? 'uso' : 'base')

  // Pré-remplir avec les quantités existantes, affichées en présentation d'usage.
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const l of demande.demande_lignes) {
      const p = produits.find((x) => x.id === l.produit_id)
      init[l.produit_id] = String(p ? displayQty(l.quantite, p).value : l.quantite)
    }
    return init
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? produits.filter((p) => p.nom.toLowerCase().includes(q)) : produits
  }, [produits, search])

  const selectedCount = Object.values(quantities).filter((q) => Number(q) > 0).length

  // Reconverti en unité de base (kg) avant envoi.
  const lignesJson = JSON.stringify(
    Object.entries(quantities)
      .filter(([, q]) => Number(q) > 0)
      .map(([produit_id, q]) => {
        const p = produits.find((x) => x.id === produit_id)
        const u = units[produit_id] ?? (p && tieneUso(p) ? 'uso' : 'base')
        return { produit_id, quantite: toBase(Number(q), u, p?.factor_uso ?? null) }
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
        className="flex w-full max-w-[560px] max-h-[88vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Editar solicitud</h2>
            <p className="text-[12.5px] text-muted-foreground font-mono">SOL-{demande.numero}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="id" value={demande.id} />
          <input type="hidden" name="lignes" value={lignesJson} />

          {/* Buscador */}
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
                En stock
              </span>
              <span className="w-28 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Cantidad
              </span>
            </div>

            {filtered.map((p) => {
              const qty = quantities[p.id] ?? ''
              const hasQty = Number(qty) > 0
              const unit = unitOf(p)
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
                    {conUso ? `${baseToUso(p.stock_actuel, p.factor_uso)} ${p.unite_uso}` : `${p.stock_actuel} ${p.unite}`}
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
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-5 py-4 flex flex-col gap-3">
            <textarea
              name="note"
              rows={2}
              defaultValue={demande.note ?? ''}
              placeholder="Nota (opcional)…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring transition"
            />

            {state.error && (
              <p className="text-[13px] text-destructive">{state.error}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                {selectedCount > 0
                  ? `${selectedCount} producto${selectedCount > 1 ? 's' : ''}`
                  : 'Ningún producto'}
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
                  {isPending ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
