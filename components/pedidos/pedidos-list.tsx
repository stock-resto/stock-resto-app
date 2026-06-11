'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/icon'
import { money, day } from '@/lib/format'
import { NuevoPedidoModal, type ProductoPedido } from './nuevo-pedido-modal'
import type { Role } from '@/types/database'

export type PedidoRow = {
  id: string
  numero: number
  statut: string
  note: string | null
  created_at: string
  enviada_at: string | null
  recibida_at: string | null
  cancelada_at: string | null
  fournisseur: { nom: string; contact: string | null } | null
  pedido_lineas: {
    id: string
    cantidad_pedida: number
    cantidad_recibida: number
    precio_unitario: number
  }[]
}

type Filtro = 'all' | 'brouillon' | 'enviada' | 'recibida' | 'cancelada'

export const STATUT_PEDIDO = {
  brouillon: { label: 'Borrador',  cls: 'text-muted-foreground bg-secondary' },
  enviada:   { label: 'Enviado',   cls: 'text-[var(--info)] bg-[color-mix(in_oklch,var(--info)_15%,transparent)]' },
  recibida:  { label: 'Recibido',  cls: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_13%,transparent)]' },
  cancelada: { label: 'Cancelado', cls: 'text-destructive bg-destructive/10' },
} as const

export function PedidosList({
  pedidos,
  productos,
  fournisseurs,
  role,
}: {
  pedidos: PedidoRow[]
  productos: ProductoPedido[]
  fournisseurs: { id: string; nom: string; contact: string | null }[]
  role: Role
}) {
  const [filtro, setFiltro] = useState<Filtro>('all')
  const [newOpen, setNewOpen] = useState(false)
  const handleCloseNew = useCallback(() => setNewOpen(false), [])

  const isPatron = role === 'patron'

  const counts = useMemo(
    () => ({
      brouillon: pedidos.filter((p) => p.statut === 'brouillon').length,
      enviada: pedidos.filter((p) => p.statut === 'enviada').length,
      recibida: pedidos.filter((p) => p.statut === 'recibida').length,
      cancelada: pedidos.filter((p) => p.statut === 'cancelada').length,
    }),
    [pedidos]
  )

  const filtered = useMemo(
    () => (filtro === 'all' ? pedidos : pedidos.filter((p) => p.statut === filtro)),
    [pedidos, filtro]
  )

  return (
    <>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">Pedidos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Órdenes de compra a proveedores, generadas desde el stock bajo.
            </p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Link
              href="/pedidos/preparar"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Icon name="cart" size={17} />
              Preparar pedidos
            </Link>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              <Icon name="plus" size={17} />
              Nuevo pedido
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-1.5">
          {([
            ['all', 'Todos', pedidos.length],
            ['brouillon', 'Borrador', counts.brouillon],
            ['enviada', 'Enviado', counts.enviada],
            ['recibida', 'Recibido', counts.recibida],
            ['cancelada', 'Cancelado', counts.cancelada],
          ] as [Filtro, string, number][]).map(([val, label, count]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFiltro(val)}
              className={
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ' +
                (filtro === val
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground')
              }
            >
              {label}
              <span
                className={
                  'rounded-md px-1.5 py-0.5 text-[11px] font-semibold ' +
                  (filtro === val ? 'bg-background/20' : 'bg-secondary')
                }
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-5 py-16 text-muted-foreground/70 shadow-sm">
            <Icon name="cart" size={28} />
            <span className="text-sm">Sin pedidos</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((p) => {
              const statut = p.statut as keyof typeof STATUT_PEDIDO
              const { label, cls } = STATUT_PEDIDO[statut] ?? STATUT_PEDIDO.brouillon
              const total = p.pedido_lineas.reduce(
                (a, l) => a + Number(l.cantidad_pedida) * Number(l.precio_unitario),
                0
              )
              return (
                <Link
                  key={p.id}
                  href={`/pedidos/${p.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition hover:border-foreground/20 hover:bg-secondary md:px-5"
                >
                  <span className="font-mono text-[13px] font-semibold">PED-{p.numero}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {p.fournisseur?.nom ?? 'Proveedor eliminado'}
                    </div>
                    <div className="truncate text-[12px] text-muted-foreground">
                      {p.pedido_lineas.length} producto{p.pedido_lineas.length > 1 ? 's' : ''}
                      {p.fournisseur?.contact ? ` · ${p.fournisseur.contact}` : ''}
                    </div>
                  </div>
                  {isPatron && (
                    <div className="hidden text-right sm:block">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                        Total estimado
                      </div>
                      <div className="font-mono text-[13px] font-semibold">{money(total)}</div>
                    </div>
                  )}
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${cls}`}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{day(p.created_at)}</span>
                  </div>
                  <Icon name="chevronRight" size={17} className="text-muted-foreground/50" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {newOpen && (
        <NuevoPedidoModal
          key="nuevo-pedido"
          productos={productos}
          fournisseurs={fournisseurs}
          onClose={handleCloseNew}
        />
      )}
    </>
  )
}
