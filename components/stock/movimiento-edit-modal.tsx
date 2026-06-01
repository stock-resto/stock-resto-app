'use client'

import { useEffect, useCallback, useState } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { editarMovimiento, eliminarMovimiento, type ProductoState } from '@/lib/stock/actions'

export type MovimientoEditable = {
  id: string
  produit_id: string
  type: string
  quantite: number
  notes: string | null
  produits: { nom: string; unite: string } | null
}

type Props = {
  mouvement: MovimientoEditable
  onClose: () => void
}

const INIT: ProductoState = {}

const inputCls =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring transition'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function MovimientoEditModal({ mouvement, onClose }: Props) {
  const [editState, editAction, editPending] = useActionState(editarMovimiento, INIT)
  const [deleteState, deleteAction, deletePending] = useActionState(eliminarMovimiento, INIT)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isPending = editPending || deletePending
  const error = editState.error ?? deleteState.error
  const typeLabel = mouvement.type === 'entree' ? 'Entrada' : 'Salida'

  useEffect(() => {
    if (editState.success || deleteState.success) onClose()
  }, [editState.success, deleteState.success, onClose])

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
        className="w-full max-w-[420px] rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Corregir {typeLabel.toLowerCase()}</h2>
            <p className="text-[12.5px] text-muted-foreground">
              {mouvement.produits?.nom ?? '—'}
            </p>
          </div>
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

        {confirmDelete ? (
          /* Confirmación de eliminación */
          <div className="px-5 py-6">
            <p className="mb-1 text-sm font-medium">¿Eliminar este movimiento?</p>
            <p className="mb-5 text-[13px] text-muted-foreground">
              El stock del producto será corregido automáticamente.
            </p>
            <form action={deleteAction} className="flex gap-3">
              <input type="hidden" name="id" value={mouvement.id} />
              <input type="hidden" name="produit_id" value={mouvement.produit_id} />
              <input type="hidden" name="type" value={mouvement.type} />
              <input type="hidden" name="quantite" value={mouvement.quantite} />
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deletePending}
                className="h-10 flex-1 rounded-lg border border-border text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deletePending}
                className="h-10 flex-1 rounded-lg bg-destructive text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {deletePending ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </form>
            {deleteState.error && (
              <p className="mt-3 text-[13px] text-destructive">{deleteState.error}</p>
            )}
          </div>
        ) : (
          /* Formulario de edición */
          <form action={editAction} className="flex flex-col gap-4 px-5 py-5">
            <input type="hidden" name="id" value={mouvement.id} />
            <input type="hidden" name="produit_id" value={mouvement.produit_id} />
            <input type="hidden" name="type" value={mouvement.type} />
            <input type="hidden" name="old_quantite" value={mouvement.quantite} />

            <Field label={`Cantidad (${mouvement.produits?.unite ?? ''})`}>
              <input
                type="number"
                name="quantite"
                required
                min="0.01"
                step="0.01"
                defaultValue={mouvement.quantite}
                className={`${inputCls} font-mono`}
              />
            </Field>

            <Field label="Nota">
              <textarea
                name="notes"
                rows={2}
                defaultValue={mouvement.notes ?? ''}
                placeholder="Motivo de la corrección…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring transition"
              />
            </Field>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-[13px] font-medium text-destructive hover:underline"
              >
                Eliminar movimiento
              </button>
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
                  disabled={isPending}
                  className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {editPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
