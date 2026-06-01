'use client'

import { useCallback, useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { dateTime } from '@/lib/format'
import { NuevaSolicitudModal } from './nueva-solicitud-modal'
import { DemandaDetailModal } from './demanda-detail-modal'
import { EditarDemandaModal } from './editar-demanda-modal'
import type { ProductoOption } from '@/components/stock/entrada-modal'
import type { Role } from '@/types/database'

export type DemandeLigneRow = {
  id: string
  produit_id: string
  quantite: number
  quantite_livree: number | null
  produits: { nom: string; unite: string } | null
}

export type DemandeRow = {
  id: string
  numero: number
  statut: string
  note: string | null
  created_at: string
  traite_at: string | null
  livre_at: string | null
  cuisinier: { nom: string } | null
  gestionnaire: { nom: string } | null
  demande_lignes: DemandeLigneRow[]
}

type Filtro = 'all' | 'en_attente' | 'approuvee' | 'rejetee' | 'livree'

const STATUT = {
  en_attente: { label: 'En espera', cls: 'text-[var(--warn)] bg-[color-mix(in_oklch,var(--warn)_15%,transparent)]' },
  approuvee:  { label: 'Aprobada',  cls: 'text-[var(--info)] bg-[color-mix(in_oklch,var(--info)_15%,transparent)]' },
  rejetee:    { label: 'Rechazada', cls: 'text-destructive bg-destructive/10' },
  livree:     { label: 'Entregada', cls: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_13%,transparent)]' },
} as const

export function DemandesList({
  demandes,
  produits,
  role,
}: {
  demandes: DemandeRow[]
  produits: ProductoOption[]
  role: Role
}) {
  const [filtro, setFiltro] = useState<Filtro>('all')
  const [newOpen, setNewOpen] = useState(false)
  const [selected, setSelected] = useState<DemandeRow | null>(null)
  const [editing, setEditing] = useState<DemandeRow | null>(null)

  const handleCloseNew = useCallback(() => setNewOpen(false), [])
  const handleCloseDetail = useCallback(() => setSelected(null), [])
  const handleCloseEdit = useCallback(() => setEditing(null), [])
  const handleEdit = useCallback((d: DemandeRow) => {
    setSelected(null)
    setEditing(d)
  }, [])

  const counts = useMemo(
    () => ({
      en_attente: demandes.filter((d) => d.statut === 'en_attente').length,
      approuvee: demandes.filter((d) => d.statut === 'approuvee').length,
      rejetee: demandes.filter((d) => d.statut === 'rejetee').length,
      livree: demandes.filter((d) => d.statut === 'livree').length,
    }),
    [demandes]
  )

  const filtered = useMemo(
    () => (filtro === 'all' ? demandes : demandes.filter((d) => d.statut === filtro)),
    [demandes, filtro]
  )

  const canCreate = role === 'cuisinier' || role === 'patron'
  const pendientes = counts.en_attente

  return (
    <>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">Solicitudes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role !== 'cuisinier' && pendientes > 0
                ? `${pendientes} solicitud${pendientes > 1 ? 'es' : ''} en espera`
                : 'Gestión de pedidos de cocina'}
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Icon name="plus" size={17} />
              Nueva solicitud
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-1.5">
          {([
            ['all', 'Todas', demandes.length],
            ['en_attente', 'En espera', counts.en_attente],
            ['approuvee', 'Aprobadas', counts.approuvee],
            ['rejetee', 'Rechazadas', counts.rejetee],
            ['livree', 'Entregadas', counts.livree],
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

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-5 py-16 text-muted-foreground/70">
              <Icon name="clipboard" size={28} />
              <span className="text-sm">Sin solicitudes</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Fecha</Th>
                    <Th>Solicitado por</Th>
                    <Th align="right">Productos</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const statut = d.statut as keyof typeof STATUT
                    const { label, cls } = STATUT[statut] ?? STATUT.en_attente
                    return (
                      <tr
                        key={d.id}
                        onClick={() => setSelected(d)}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary"
                      >
                        <td className="px-[18px] py-3 font-mono text-[13px] font-semibold">
                          SOL-{d.numero}
                        </td>
                        <td className="whitespace-nowrap px-[18px] py-3 text-[13px] text-muted-foreground">
                          {dateTime(d.created_at)}
                        </td>
                        <td className="px-[18px] py-3 text-muted-foreground">
                          {d.cuisinier?.nom ?? '—'}
                        </td>
                        <td className="px-[18px] py-3 text-right font-mono text-[13px]">
                          {d.demande_lignes.length}
                        </td>
                        <td className="px-[18px] py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${cls}`}>
                            <span className="size-1.5 rounded-full bg-current" />
                            {label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {newOpen && (
        <NuevaSolicitudModal key="nueva-solicitud" produits={produits} onClose={handleCloseNew} />
      )}
      {selected && (
        <DemandaDetailModal
          key={`detail-${selected.id}`}
          demande={selected}
          role={role}
          onClose={handleCloseDetail}
          onEdit={role === 'patron' ? () => handleEdit(selected) : undefined}
        />
      )}
      {editing && (
        <EditarDemandaModal
          key={`edit-${editing.id}`}
          demande={editing}
          produits={produits}
          onClose={handleCloseEdit}
        />
      )}
    </>
  )
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={
        'border-b border-border px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground/70 ' +
        (align === 'right' ? 'text-right' : 'text-left')
      }
    >
      {children}
    </th>
  )
}
