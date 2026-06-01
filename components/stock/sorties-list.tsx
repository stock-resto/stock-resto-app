'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/icon'
import { dateTime } from '@/lib/format'
import { SortieModal } from './sortie-modal'
import type { ProductoOption } from './entrada-modal'

export type SortieMouvementRow = {
  id: string
  quantite: number
  notes: string | null
  created_at: string
  produits: { nom: string; unite: string } | null
  users: { nom: string } | null
}

export function SortiesList({
  mouvements,
  produits,
  canEdit,
}: {
  mouvements: SortieMouvementRow[]
  produits: ProductoOption[]
  canEdit: boolean
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const handleClose = useCallback(() => setModalOpen(false), [])

  return (
    <>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">Salidas de stock</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Historial de salidas manuales de mercancía
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-secondary"
            >
              <Icon name="arrowUp" size={17} />
              Nueva salida
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {mouvements.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 px-5 py-16 text-muted-foreground/70">
              <Icon name="arrowUp" size={28} />
              <span className="text-sm">Sin salidas registradas</span>
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
                  </tr>
                </thead>
                <tbody>
                  {mouvements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 hover:bg-secondary"
                    >
                      <td className="whitespace-nowrap px-[18px] py-3 text-[13px] text-muted-foreground">
                        {dateTime(m.created_at)}
                      </td>
                      <td className="px-[18px] py-3 font-medium">
                        {m.produits?.nom ?? '—'}
                      </td>
                      <td className="px-[18px] py-3 text-right font-mono font-semibold text-destructive">
                        -{m.quantite}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <SortieModal key="sortie-modal" produits={produits} onClose={handleClose} />
      )}
    </>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
}) {
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
