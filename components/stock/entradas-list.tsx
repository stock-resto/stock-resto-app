'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/icon'
import { dateTime } from '@/lib/format'
import { EntradaModal, type ProductoOption } from './entrada-modal'
import { MovimientoEditModal, type MovimientoEditable } from './movimiento-edit-modal'

export type MouvementRow = MovimientoEditable & {
  created_at: string
  users: { nom: string } | null
}

export function EntradasList({
  mouvements,
  produits,
  canEdit,
  canPatron,
}: {
  mouvements: MouvementRow[]
  produits: ProductoOption[]
  canEdit: boolean
  canPatron: boolean
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MouvementRow | null>(null)

  const handleClose = useCallback(() => setModalOpen(false), [])
  const handleCloseEdit = useCallback(() => setEditing(null), [])

  return (
    <>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">Entradas de stock</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Historial de recepciones de mercancía
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Icon name="plus" size={17} />
              Nueva entrada
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {mouvements.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-5 py-16 text-muted-foreground/70">
              <Icon name="arrowDown" size={28} />
              <span className="text-sm">Sin entradas registradas</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Producto</Th>
                    <Th align="right">Cantidad</Th>
                    <Th>Registrado por</Th>
                    <Th>Nota</Th>
                    {canPatron && <Th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {mouvements.map((m) => (
                    <tr
                      key={m.id}
                      className="group border-b border-border last:border-0 hover:bg-secondary"
                    >
                      <td className="whitespace-nowrap px-[18px] py-3 text-[13px] text-muted-foreground">
                        {dateTime(m.created_at)}
                      </td>
                      <td className="px-[18px] py-3 font-medium">
                        {m.produits?.nom ?? '—'}
                      </td>
                      <td className="px-[18px] py-3 text-right font-mono font-semibold text-[var(--ok)]">
                        +{m.quantite}
                        <em className="ml-0.5 not-italic text-[11px] text-muted-foreground/70">
                          {m.produits?.unite}
                        </em>
                      </td>
                      <td className="px-[18px] py-3 text-muted-foreground">
                        {m.users?.nom ?? '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-[18px] py-3 text-[13px] text-muted-foreground">
                        {m.notes ?? '—'}
                      </td>
                      {canPatron && (
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setEditing(m)}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                            aria-label="Corregir movimiento"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <EntradaModal key="entrada-modal" produits={produits} onClose={handleClose} />
      )}
      {editing && (
        <MovimientoEditModal
          key={`edit-${editing.id}`}
          mouvement={editing}
          onClose={handleCloseEdit}
        />
      )}
    </>
  )
}

function Th({
  children,
  align = 'left',
  className = '',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <th
      className={
        'border-b border-border px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground/70 ' +
        (align === 'right' ? 'text-right ' : 'text-left ') +
        className
      }
    >
      {children}
    </th>
  )
}
