'use client'

import { useActionState, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icon'
import { crearPedido, type PedidoState } from '@/lib/pedidos/actions'

export type ProductoPedido = {
  id: string
  nom: string
  unite: string
  unite_achat: string | null
  presentation: string | null
  fournisseur_id: string | null
  stock_actuel: number
  stock_minimum: number
}

type Props = {
  productos: ProductoPedido[]
  fournisseurs: { id: string; nom: string; contact: string | null }[]
  onClose: () => void
}

const INIT: PedidoState = {}

export function NuevoPedidoModal({ productos, fournisseurs, onClose }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(crearPedido, INIT)
  const [fournisseurId, setFournisseurId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const productosProv = useMemo(() => {
    const q = search.trim().toLowerCase()
    return productos
      .filter((p) => p.fournisseur_id === fournisseurId)
      .filter((p) => (q ? p.nom.toLowerCase().includes(q) : true))
  }, [productos, fournisseurId, search])

  const lineasJson = JSON.stringify(
    Object.entries(quantities)
      .filter(([, q]) => Number(q) > 0)
      .map(([produit_id, q]) => ({ produit_id, cantidad: Number(q) }))
  )
  const selectedCount = Object.values(quantities).filter((q) => Number(q) > 0).length

  useEffect(() => {
    if (state.success) {
      if (state.pedidoId) router.push(`/pedidos/${state.pedidoId}`)
      else onClose()
    }
  }, [state.success, state.pedidoId, router, onClose])

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
        aria-label="Nuevo pedido"
        className="flex w-full max-w-[560px] max-h-[88vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Nuevo pedido</h2>
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
          <input type="hidden" name="fournisseur_id" value={fournisseurId} />
          <input type="hidden" name="lineas" value={lineasJson} />

          {/* Proveedor */}
          <div className="shrink-0 border-b border-border px-4 py-3">
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Proveedor</label>
            <select
              value={fournisseurId}
              onChange={(e) => {
                setFournisseurId(e.target.value)
                setQuantities({})
              }}
              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition focus:border-ring"
            >
              <option value="">Selecciona un proveedor…</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          {fournisseurId && (
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
          )}

          {/* Lista */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!fournisseurId ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground/60">
                Selecciona un proveedor para ver sus productos.
              </div>
            ) : productosProv.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground/60">
                Este proveedor no tiene productos.
              </div>
            ) : (
              productosProv.map((p) => {
                const qty = quantities[p.id] ?? ''
                const hasQty = Number(qty) > 0
                return (
                  <div
                    key={p.id}
                    className={
                      'flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 transition ' +
                      (hasQty ? 'bg-[color-mix(in_oklch,var(--ok)_6%,transparent)]' : 'hover:bg-secondary')
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.nom}</div>
                      <div className="text-[12px] text-muted-foreground">
                        En stock: {p.stock_actuel} {p.unite}
                        {p.unite_achat ? (
                          <span className="text-muted-foreground/70"> · pedir en {p.unite_achat}</span>
                        ) : null}
                      </div>
                    </div>
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
                        className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-right font-mono text-sm outline-none transition focus:border-ring"
                      />
                      <span className="text-[11px] text-muted-foreground/70">{p.unite_achat ?? p.unite}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-border px-5 py-4">
            <textarea
              name="note"
              rows={2}
              placeholder="Nota para el proveedor (opcional)…"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring"
            />

            {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}

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
                  disabled={isPending || !fournisseurId || selectedCount === 0}
                  className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Creando…' : 'Crear pedido'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
