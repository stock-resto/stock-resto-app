'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icon'
import { money, day } from '@/lib/format'
import { STATUT_PEDIDO } from './pedidos-list'
import { RegistrarRecepcionModal, type LineaPendiente } from './registrar-recepcion-modal'
import {
  editarPedido,
  marcarEnviado,
  cerrarPedido,
  cancelarPedido,
  eliminarPedido,
  type PedidoState,
} from '@/lib/pedidos/actions'

export type PedidoDetailData = {
  id: string
  numero: number
  statut: string
  note: string | null
  createdAt: string
  fournisseurNom: string
  fournisseurContact: string | null
}

export type LineaDetail = {
  id: string
  produit_id: string
  nom: string
  presentation: string | null
  unite: string
  uniteAchat: string | null
  factor: number
  cantidad_pedida: number
  cantidad_recibida: number
  precio: number
}

export type ProductoFournisseur = {
  id: string
  nom: string
  unite: string
  uniteAchat: string | null
  factor: number
  presentation: string | null
  precio: number
}

type EditLinea = {
  produit_id: string
  nom: string
  presentation: string | null
  unite: string
  uniteAchat: string | null
  factor: number
  cantidad: string
  precio: number
}

export function PedidoDetail({
  pedido,
  lineas,
  productosFournisseur,
  isPatron,
  canCancel,
}: {
  pedido: PedidoDetailData
  lineas: LineaDetail[]
  productosFournisseur: ProductoFournisseur[]
  isPatron: boolean
  canCancel: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [recepcionOpen, setRecepcionOpen] = useState(false)

  const statut = pedido.statut as keyof typeof STATUT_PEDIDO
  const { label, cls } = STATUT_PEDIDO[statut] ?? STATUT_PEDIDO.brouillon
  const isBorrador = pedido.statut === 'brouillon'
  const isEnviada = pedido.statut === 'enviada'

  // ── Estado editable (solo borrador) ──
  const signature = useMemo(
    () => JSON.stringify(lineas.map((l) => [l.produit_id, l.cantidad_pedida])) + (pedido.note ?? ''),
    [lineas, pedido.note]
  )
  const initialEdit = useMemo<EditLinea[]>(
    () =>
      lineas.map((l) => ({
        produit_id: l.produit_id,
        nom: l.nom,
        presentation: l.presentation,
        unite: l.unite,
        uniteAchat: l.uniteAchat,
        factor: l.factor,
        cantidad: String(l.cantidad_pedida),
        precio: l.precio,
      })),
    [lineas]
  )
  const [editLineas, setEditLineas] = useState<EditLinea[]>(initialEdit)
  const [note, setNote] = useState(pedido.note ?? '')

  // Resync tras guardar/refresh : reset de estado al cambiar los datos del servidor
  // (patrón oficial React de ajuste de estado durante el render).
  const [prevSig, setPrevSig] = useState(signature)
  if (signature !== prevSig) {
    setPrevSig(signature)
    setEditLineas(initialEdit)
    setNote(pedido.note ?? '')
  }

  const dirty = useMemo(() => {
    const cur = JSON.stringify(editLineas.map((l) => [l.produit_id, Number(l.cantidad) || 0])) + note
    const init = JSON.stringify(initialEdit.map((l) => [l.produit_id, Number(l.cantidad) || 0])) + (pedido.note ?? '')
    return cur !== init
  }, [editLineas, note, initialEdit, pedido.note])

  const productosDisponibles = useMemo(
    () => productosFournisseur.filter((p) => !editLineas.some((l) => l.produit_id === p.id)),
    [productosFournisseur, editLineas]
  )

  // Total estimado : la cantidad está en unidad de compra → se convierte a base
  // (× factor) para multiplicar por el precio (que es por unidad de base).
  const totalBorrador = editLineas.reduce((a, l) => a + (Number(l.cantidad) || 0) * l.factor * l.precio, 0)
  const totalOtros = lineas.reduce((a, l) => a + l.cantidad_pedida * l.factor * l.precio, 0)

  function run(fn: () => Promise<PedidoState>, after?: () => void) {
    startTransition(async () => {
      setError(null)
      const res = await fn()
      if (res.error) setError(res.error)
      else if (after) after()
      else router.refresh()
    })
  }

  function buildEditFormData() {
    const fd = new FormData()
    fd.set('id', pedido.id)
    fd.set('note', note)
    fd.set(
      'lineas',
      JSON.stringify(
        editLineas
          .filter((l) => Number(l.cantidad) > 0)
          .map((l) => ({ produit_id: l.produit_id, cantidad: Number(l.cantidad) }))
      )
    )
    return fd
  }

  const guardar = () => run(() => editarPedido({}, buildEditFormData()))

  const guardarYEnviar = () =>
    startTransition(async () => {
      setError(null)
      if (dirty) {
        const r1 = await editarPedido({}, buildEditFormData())
        if (r1.error) return setError(r1.error)
      }
      const fd = new FormData()
      fd.set('id', pedido.id)
      const r2 = await marcarEnviado({}, fd)
      if (r2.error) return setError(r2.error)
      router.refresh()
    })

  const cerrar = () => {
    const fd = new FormData()
    fd.set('id', pedido.id)
    run(() => cerrarPedido({}, fd))
  }

  const cancelar = () => {
    if (!confirm('¿Cancelar este pedido? Las recepciones ya registradas se conservan.')) return
    const fd = new FormData()
    fd.set('id', pedido.id)
    run(() => cancelarPedido({}, fd))
  }

  const eliminar = () => {
    if (!confirm('¿Eliminar este borrador?')) return
    const fd = new FormData()
    fd.set('id', pedido.id)
    run(() => eliminarPedido({}, fd), () => router.push('/pedidos'))
  }

  // Pendiente calculé en unité de base : pedida (× facteur si unité d'achat) − reçu.
  // La réception se saisit toujours en unité de base.
  const pendientes: LineaPendiente[] = lineas
    .map((l) => {
      const pedidaEnBase = l.cantidad_pedida * l.factor
      const pendiente = pedidaEnBase - l.cantidad_recibida
      return {
        id: l.id,
        nom: l.nom,
        unite: l.unite,
        pendiente,
        pedidaLabel: `${l.cantidad_pedida} ${l.uniteAchat ?? l.unite}`,
        aprox: !!l.uniteAchat,
      }
    })
    .filter((l) => l.pendiente > 0)

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-[18px] px-5 py-7 md:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Link href="/pedidos" className="hover:text-foreground">Pedidos</Link>
        <Icon name="chevronRight" size={13} />
        <span className="font-mono text-foreground">PED-{pedido.numero}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[22px] font-bold tracking-tight">PED-{pedido.numero}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${cls}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {label}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
            <span className="font-semibold">{pedido.fournisseurNom}</span>
            {pedido.fournisseurContact && (
              <span className="text-muted-foreground">{pedido.fournisseurContact}</span>
            )}
            <span className="text-muted-foreground">· {day(pedido.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* ── BORRADOR : editable ── */}
      {isBorrador ? (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <Th>Producto</Th>
                    <Th>Presentación</Th>
                    <Th align="right">Cantidad</Th>
                    {isPatron && <Th align="right">Precio unit.</Th>}
                    {isPatron && <Th align="right">Subtotal</Th>}
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {editLineas.length === 0 ? (
                    <tr>
                      <td colSpan={isPatron ? 6 : 4} className="px-4 py-8 text-center text-sm text-muted-foreground/70">
                        Agrega productos al pedido.
                      </td>
                    </tr>
                  ) : (
                    editLineas.map((l, i) => (
                      <tr key={l.produit_id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 font-medium">{l.nom}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{l.presentation ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={l.cantidad}
                              onChange={(e) =>
                                setEditLineas((prev) =>
                                  prev.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x))
                                )
                              }
                              className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-right font-mono text-sm outline-none transition focus:border-ring"
                            />
                            <span className="text-[11px] text-muted-foreground/70">{l.uniteAchat ?? l.unite}</span>
                          </div>
                        </td>
                        {isPatron && (
                          <td className="px-4 py-2.5 text-right font-mono text-[13px] text-muted-foreground">
                            {money(l.precio)}
                          </td>
                        )}
                        {isPatron && (
                          <td className="px-4 py-2.5 text-right font-mono text-[13px] font-semibold">
                            {money((Number(l.cantidad) || 0) * l.factor * l.precio)}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditLineas((prev) => prev.filter((_, j) => j !== i))}
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-destructive"
                            aria-label="Quitar"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Agregar producto */}
            {productosDisponibles.length > 0 && (
              <div className="border-t border-border p-3">
                <select
                  value=""
                  onChange={(e) => {
                    const p = productosDisponibles.find((x) => x.id === e.target.value)
                    if (!p) return
                    setEditLineas((prev) => [
                      ...prev,
                      { produit_id: p.id, nom: p.nom, presentation: p.presentation, unite: p.unite, uniteAchat: p.uniteAchat, factor: p.factor, cantidad: '', precio: p.precio },
                    ])
                  }}
                  className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground outline-none transition focus:border-ring"
                >
                  <option value="">+ Agregar producto…</option>
                  {productosDisponibles.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Nota + total */}
          <div className="grid gap-4 md:grid-cols-[1fr_300px] md:items-start">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Nota
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nota para el proveedor (opcional)…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring"
              />
            </div>
            {isPatron && (
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total estimado</span>
                  <span className="font-mono text-[17px] font-bold">{money(totalBorrador)}</span>
                </div>
                <p className="mt-1 text-right text-[11px] text-muted-foreground/70">Visible solo para el dueño</p>
              </div>
            )}
          </div>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          {/* Acciones borrador */}
          <div className="flex flex-wrap items-center gap-2.5">
            {dirty && (
              <button
                type="button"
                onClick={guardar}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary disabled:opacity-50"
              >
                <Icon name="check" size={16} />
                Guardar cambios
              </button>
            )}
            <button
              type="button"
              onClick={guardarYEnviar}
              disabled={pending || editLineas.filter((l) => Number(l.cantidad) > 0).length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              <Icon name="send" size={16} />
              Marcar como enviado
            </button>
            <a
              href={`/pedidos/${pedido.id}/imprimir`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              <Icon name="printer" size={16} />
              Imprimir
            </a>
            <div className="flex-1" />
            <button
              type="button"
              onClick={eliminar}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            >
              <Icon name="trash" size={16} />
              Eliminar
            </button>
          </div>
        </>
      ) : (
        /* ── ENVIADA / RECIBIDA / CANCELADA : lectura ── */
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <Th>Producto</Th>
                    <Th>Presentación</Th>
                    <Th align="right">Pedida</Th>
                    <Th align="right">Recibida</Th>
                    <Th align="right">Pendiente</Th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((l) => {
                    const pedidaEnBase = l.cantidad_pedida * l.factor
                    const pend = pedidaEnBase - l.cantidad_recibida
                    const tieneCompra = !!l.uniteAchat
                    return (
                      <tr key={l.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 font-medium">{l.nom}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{l.presentation ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                          {l.cantidad_pedida}{' '}
                          <span className="font-sans text-[11px] text-muted-foreground/70">{l.uniteAchat ?? l.unite}</span>
                          {tieneCompra && (
                            <div className="font-sans text-[11px] font-normal text-muted-foreground/60">
                              ≈ {pedidaEnBase} {l.unite}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-2.5 text-right font-mono font-semibold"
                          style={{ color: l.cantidad_recibida ? 'var(--ok)' : 'var(--muted-foreground)' }}
                        >
                          {l.cantidad_recibida}{' '}
                          <span className="font-sans text-[11px] text-muted-foreground/70">{l.unite}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          <span className={pend > 0 ? 'text-[var(--warn)]' : 'text-muted-foreground/50'}>
                            {pend}
                          </span>{' '}
                          <span className="font-sans text-[11px] font-normal text-muted-foreground/70">{l.unite}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {isEnviada && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              {pendientes.length > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[color-mix(in_oklch,var(--warn)_15%,transparent)] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--warn)]">
                    <span className="size-1.5 rounded-full bg-current" />
                    Recepción parcial
                  </span>
                  <span>{pendientes.length} línea{pendientes.length > 1 ? 's' : ''} con pendientes por recibir.</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[color-mix(in_oklch,var(--ok)_13%,transparent)] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--ok)]">
                  <Icon name="check" size={13} />
                  Todo recibido — listo para cerrar.
                </span>
              )}
            </div>
          )}

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isEnviada && (
              <>
                <button
                  type="button"
                  onClick={() => setRecepcionOpen(true)}
                  disabled={pending || pendientes.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                >
                  <Icon name="arrowDown" size={16} />
                  Registrar recepción
                </button>
                <button
                  type="button"
                  onClick={cerrar}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary disabled:opacity-50"
                >
                  <Icon name="check" size={16} />
                  Cerrar pedido
                </button>
              </>
            )}
            <a
              href={`/pedidos/${pedido.id}/imprimir`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              <Icon name="printer" size={16} />
              Imprimir
            </a>

            {isPatron && (
              <div className="hidden text-right sm:block">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Total estimado </span>
                <span className="font-mono text-[13px] font-semibold">{money(totalOtros)}</span>
              </div>
            )}

            {isEnviada && canCancel && (
              <>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={cancelar}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Icon name="x" size={16} />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </>
      )}

      {recepcionOpen && (
        <RegistrarRecepcionModal
          key="recepcion"
          pedidoId={pedido.id}
          numero={pedido.numero}
          lineas={pendientes}
          onClose={() => setRecepcionOpen(false)}
        />
      )}
    </div>
  )
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={
        'px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground/70 ' +
        (align === 'right' ? 'text-right' : 'text-left')
      }
    >
      {children}
    </th>
  )
}
