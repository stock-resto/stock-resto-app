'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icon'
import { crearPedidosDesdeAlertas, type PedidoState } from '@/lib/pedidos/actions'

export type AlertaProducto = {
  id: string
  nom: string
  unite: string
  unite_achat: string | null
  factor_achat: number | null
  stock_actuel: number
  stock_minimum: number
  stock_maximum: number | null
  fournisseur_id: string | null
  fournisseur_nom: string | null
}

const INIT: PedidoState = {}

// Unité dans laquelle on commande : unité d'achat si définie, sinon unité de base.
function ordenUnidad(p: AlertaProducto): string {
  return p.unite_achat ?? p.unite
}

// Quantité suggérée pour atteindre le stock max, exprimée dans l'unité de commande.
// Déficit (max − actuel) en base → converti en unité d'achat (arrondi sup.) si applicable.
function sugerencia(p: AlertaProducto): string {
  if (p.stock_maximum === null) return ''
  const deficit = p.stock_maximum - p.stock_actuel
  if (deficit <= 0) return ''
  if (p.unite_achat && p.factor_achat && p.factor_achat > 0) {
    return String(Math.ceil(deficit / p.factor_achat))
  }
  return String(deficit)
}

type Grupo = { fournisseur_id: string; nom: string; items: AlertaProducto[] }

export function PrepararPedidos({ alertas }: { alertas: AlertaProducto[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(crearPedidosDesdeAlertas, INIT)

  // Sélection (checkbox) + quantités, indexées par produit_id
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(alertas.filter((a) => a.fournisseur_id).map((a) => [a.id, true]))
  )
  const [qty, setQty] = useState<Record<string, string>>(() =>
    Object.fromEntries(alertas.map((a) => [a.id, sugerencia(a)]))
  )

  const { grupos, sinProveedor } = useMemo(() => {
    const map = new Map<string, Grupo>()
    const sin: AlertaProducto[] = []
    for (const a of alertas) {
      if (!a.fournisseur_id) {
        sin.push(a)
        continue
      }
      const g = map.get(a.fournisseur_id) ?? {
        fournisseur_id: a.fournisseur_id,
        nom: a.fournisseur_nom ?? 'Proveedor',
        items: [],
      }
      g.items.push(a)
      map.set(a.fournisseur_id, g)
    }
    return { grupos: [...map.values()], sinProveedor: sin }
  }, [alertas])

  // Groupes effectivement sélectionnés (au moins 1 produit coché avec qty > 0)
  const gruposJson = useMemo(() => {
    return grupos
      .map((g) => ({
        fournisseur_id: g.fournisseur_id,
        items: g.items
          .filter((it) => checked[it.id] && Number(qty[it.id]) > 0)
          .map((it) => ({ produit_id: it.id, cantidad: Number(qty[it.id]) })),
      }))
      .filter((g) => g.items.length > 0)
  }, [grupos, checked, qty])

  const totalProdSel = gruposJson.reduce((a, g) => a + g.items.length, 0)
  const totalProv = gruposJson.length

  useEffect(() => {
    if (state.success) router.push('/pedidos')
  }, [state.success, router])

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 pb-28 md:px-8">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link href="/pedidos" className="hover:text-foreground">Pedidos</Link>
        <Icon name="chevronRight" size={13} />
        <span className="text-foreground">Preparar pedidos</span>
      </div>
      <div>
        <h1 className="text-[25px] font-bold tracking-tight">Preparar pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Productos por debajo del mínimo, agrupados por proveedor.
        </p>
      </div>

      {alertas.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-5 py-16 text-muted-foreground/70 shadow-sm">
          <Icon name="check" size={28} />
          <span className="text-sm">Ningún producto por debajo del mínimo.</span>
        </div>
      ) : (
        <>
          {grupos.map((g) => (
            <div key={g.fournisseur_id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="truck" size={16} className="text-muted-foreground" />
                  {g.nom}
                </div>
                <span className="text-[12px] text-muted-foreground">{g.items.length} productos</span>
              </div>
              {g.items.map((it) => {
                const on = checked[it.id] ?? false
                return (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => setChecked((p) => ({ ...p, [it.id]: !on }))}
                      className={
                        'grid size-5 shrink-0 place-items-center rounded-md border transition ' +
                        (on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background')
                      }
                      aria-label={on ? 'Quitar' : 'Incluir'}
                    >
                      {on && <Icon name="check" size={13} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{it.nom}</div>
                      <div className="text-[12px] text-muted-foreground">
                        Pedir en: {ordenUnidad(it)}
                        {it.unite_achat && it.factor_achat ? (
                          <span className="text-muted-foreground/70"> · ~{it.factor_achat} {it.unite}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                        Stock act. / mín.
                      </div>
                      <div className="font-mono text-[13px]">
                        <span className={it.stock_actuel === 0 ? 'text-destructive' : 'text-[var(--warn)]'}>
                          {it.stock_actuel}
                        </span>
                        <span className="text-muted-foreground"> / {it.stock_minimum} {it.unite}</span>
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                        Cantidad ({ordenUnidad(it)})
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={qty[it.id] ?? ''}
                        onChange={(e) => setQty((p) => ({ ...p, [it.id]: e.target.value }))}
                        placeholder="—"
                        className="mt-0.5 h-8 w-28 rounded-lg border border-border bg-background px-2 text-right font-mono text-sm outline-none transition focus:border-ring"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Sin proveedor */}
          {sinProveedor.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-dashed border-border bg-card/60 shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Icon name="alert" size={15} />
                  Sin proveedor
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {sinProveedor.length} productos · no incluidos
                </span>
              </div>
              {sinProveedor.map((it) => (
                <div key={it.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-muted-foreground">{it.nom}</div>
                    <div className="text-[12px] text-muted-foreground/70">Unidad: {it.unite}</div>
                  </div>
                  <div className="hidden text-right font-mono text-[13px] sm:block">
                    <span className={it.stock_actuel === 0 ? 'text-destructive' : 'text-[var(--warn)]'}>
                      {it.stock_actuel}
                    </span>
                    <span className="text-muted-foreground"> / {it.stock_minimum} {it.unite}</span>
                  </div>
                  <Link href="/stock" className="text-[13px] font-medium text-primary hover:underline">
                    Asignar proveedor
                  </Link>
                </div>
              ))}
            </div>
          )}

          {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}
        </>
      )}

      {/* Footer collant */}
      {alertas.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 backdrop-blur md:left-60">
          <form
            action={formAction}
            className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 md:px-8"
          >
            <input type="hidden" name="grupos" value={JSON.stringify(gruposJson)} />
            <div className="text-[13px] text-muted-foreground">
              <strong className="text-foreground">{totalProv} proveedor{totalProv > 1 ? 'es' : ''}</strong>
              {' · '}{totalProdSel} producto{totalProdSel > 1 ? 's' : ''} seleccionado{totalProdSel > 1 ? 's' : ''}
            </div>
            <button
              type="submit"
              disabled={isPending || totalProv === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              <Icon name="check" size={17} />
              {isPending
                ? 'Creando…'
                : `Crear ${totalProv || ''} pedido${totalProv > 1 ? 's' : ''} (borrador)`}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
