'use client'

import { useEffect, useCallback, useState } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import {
  aprobarDemanda,
  rechazarDemanda,
  entregarDemanda,
  type DemandaState,
} from '@/lib/demandes/actions'
import { dateTime } from '@/lib/format'
import { toBase, baseToUso, tieneUso, displayQty } from '@/lib/units'
import type { DemandeRow, DemandeLigneRow } from './demandes-list'
import type { Role } from '@/types/database'

const NO_UNITS = { unite: '', unite_uso: null, factor_uso: null }
// Unités d'une ligne (depuis le produit joint), avec fallback sûr.
function lineUnits(l: DemandeLigneRow) {
  return l.produits ?? NO_UNITS
}

type Props = {
  demande: DemandeRow
  role: Role
  onClose: () => void
  onEdit?: () => void
}

const INIT: DemandaState = {}

const STATUT = {
  en_attente: { label: 'En espera', cls: 'text-[var(--warn)] bg-[color-mix(in_oklch,var(--warn)_15%,transparent)]' },
  approuvee:  { label: 'Aprobada',  cls: 'text-[var(--info)] bg-[color-mix(in_oklch,var(--info)_15%,transparent)]' },
  rejetee:    { label: 'Rechazada', cls: 'text-destructive bg-destructive/10' },
  livree:     { label: 'Entregada', cls: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_13%,transparent)]' },
} as const

export function DemandaDetailModal({ demande, role, onClose, onEdit }: Props) {
  const [aprobarState, aprobarAction, aprobarPending] = useActionState(aprobarDemanda, INIT)
  const [rechazarState, rechazarAction, rechazarPending] = useActionState(rechazarDemanda, INIT)
  const [entregarState, entregarAction, entregarPending] = useActionState(entregarDemanda, INIT)

  // Cantidades livrées, saisies dans l'unité d'affichage (sacs si dispo),
  // pré-remplies avec la quantité solicitada.
  const [livrees, setLivrees] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      demande.demande_lignes.map((l) => [l.id, String(displayQty(l.quantite, lineUnits(l)).value)])
    )
  )

  const isPending = aprobarPending || rechazarPending || entregarPending
  const error = aprobarState.error ?? rechazarState.error ?? entregarState.error
  const canAct = role !== 'cuisinier'

  // Reconverti en unité de base (kg) pour le mouvement de sortie (trigger).
  const livreesJson = JSON.stringify(
    demande.demande_lignes.map((l) => {
      const u = lineUnits(l)
      const saisie = Number(livrees[l.id] ?? displayQty(l.quantite, u).value)
      const base = toBase(saisie, tieneUso(u) ? 'uso' : 'base', u.factor_uso)
      return { ligne_id: l.id, quantite_livree: Math.max(0.01, base) }
    })
  )

  useEffect(() => {
    if (aprobarState.success || rechazarState.success || entregarState.success) onClose()
  }, [aprobarState.success, rechazarState.success, entregarState.success, onClose])

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

  const statut = demande.statut as keyof typeof STATUT
  const { label: statutLabel, cls: statutCls } = STATUT[statut] ?? STATUT.en_attente
  const isEntrega = demande.statut === 'approuvee' && canAct

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={handleBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[520px] max-h-[88vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[15px] font-bold">SOL-{demande.numero}</span>
              <span className={`rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${statutCls}`}>
                {statutLabel}
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {demande.cuisinier?.nom ?? '—'} · {dateTime(demande.created_at)}
            </p>
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

        {/* Contenido scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Productos */}
          <div className="px-5 pt-4 pb-2">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Productos
            </p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <Th>Producto</Th>
                    <Th align="right">Solicitado</Th>
                    {isEntrega && <Th align="right">A entregar</Th>}
                    {demande.statut === 'livree' && <Th align="right">Entregado</Th>}
                  </tr>
                </thead>
                <tbody>
                  {demande.demande_lignes.map((l) => {
                    const u = lineUnits(l)
                    const sol = displayQty(l.quantite, u)
                    const ent = displayQty(l.quantite_livree ?? l.quantite, u)
                    return (
                      <tr key={l.id} className="border-t border-border">
                        <td className="px-4 py-2.5 font-medium">{l.produits?.nom ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                          {sol.value}
                          <em className="ml-0.5 not-italic text-[11px] text-muted-foreground/70">
                            {sol.unit}
                          </em>
                        </td>
                        {isEntrega && (
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={livrees[l.id] ?? sol.value}
                                onChange={(e) =>
                                  setLivrees((prev) => ({ ...prev, [l.id]: e.target.value }))
                                }
                                className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-right text-sm font-mono outline-none focus:border-ring transition"
                              />
                              <span className="text-[11px] text-muted-foreground/70">{sol.unit}</span>
                            </div>
                          </td>
                        )}
                        {demande.statut === 'livree' && (
                          <td className="px-4 py-2.5 text-right font-mono text-[13px] font-semibold text-[var(--ok)]">
                            {ent.value}
                            <em className="ml-0.5 not-italic text-[11px] text-muted-foreground/70">
                              {ent.unit}
                            </em>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nota */}
          {demande.note && (
            <div className="px-5 py-3">
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                Nota
              </p>
              <p className="text-[13.5px]">{demande.note}</p>
            </div>
          )}

          {/* Fechas */}
          {(demande.traite_at || demande.livre_at) && (
            <div className="px-5 pb-4 flex gap-4">
              {demande.traite_at && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {demande.statut === 'rejetee' ? 'Rechazada' : 'Aprobada'}
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {demande.gestionnaire?.nom} · {dateTime(demande.traite_at)}
                  </p>
                </div>
              )}
              {demande.livre_at && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    Entregada
                  </p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {dateTime(demande.livre_at)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer acciones */}
        {error && (
          <p className="shrink-0 border-t border-border px-5 py-2 text-[13px] text-destructive">
            {error}
          </p>
        )}

        {/* Editar (patron, en espera) */}
        {demande.statut === 'en_attente' && role === 'patron' && onEdit && (
          <div className="shrink-0 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={onEdit}
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Editar solicitud
            </button>
          </div>
        )}

        {/* En espera → Aprobar / Rechazar */}
        {demande.statut === 'en_attente' && canAct && (
          <div className="shrink-0 flex gap-3 border-t border-border px-5 py-4">
            <form action={rechazarAction} className="flex-1">
              <input type="hidden" name="id" value={demande.id} />
              <button
                type="submit"
                disabled={isPending}
                className="h-10 w-full rounded-lg border border-border text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
              >
                {rechazarPending ? 'Rechazando…' : 'Rechazar'}
              </button>
            </form>
            <form action={aprobarAction} className="flex-1">
              <input type="hidden" name="id" value={demande.id} />
              <button
                type="submit"
                disabled={isPending}
                className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {aprobarPending ? 'Aprobando…' : 'Aprobar'}
              </button>
            </form>
          </div>
        )}

        {/* Aprobada → Marcar como entregada */}
        {isEntrega && (
          <form action={entregarAction} className="shrink-0 border-t border-border px-5 py-4">
            <input type="hidden" name="demande_id" value={demande.id} />
            <input type="hidden" name="livrees" value={livreesJson} />
            <button
              type="submit"
              disabled={isPending}
              className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {entregarPending ? 'Registrando entrega…' : 'Marcar como entregada'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={
        'border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 ' +
        (align === 'right' ? 'text-right' : 'text-left')
      }
    >
      {children}
    </th>
  )
}
