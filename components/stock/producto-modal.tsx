'use client'

import { useEffect, useCallback, useState } from 'react'
import { useActionState } from 'react'
import { Icon } from '@/components/icon'
import { Combobox } from '@/components/ui/combobox'
import {
  upsertProducto,
  desactivarProducto,
  type ProductoState,
} from '@/lib/stock/actions'
import type { ProduitRow } from './stock-table'

const UNIT_OPTS = ['kg', 'g', 'L', 'mL', 'unidad', 'docena', 'caja', 'bolsa', 'saco']

type Props = {
  mode: 'create' | 'edit'
  produit: ProduitRow | null
  categories: { id: string; nom: string }[]
  fournisseurs: { id: string; nom: string }[]
  canSeeFinance: boolean
  canDeactivate: boolean
  onClose: () => void
}

const INIT: ProductoState = {}

const inputCls =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring transition'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function ProductoModal({
  mode,
  produit,
  categories,
  fournisseurs,
  canSeeFinance,
  canDeactivate,
  onClose,
}: Props) {
  const [upsertState, upsertAction, upsertPending] = useActionState(upsertProducto, INIT)
  const [deactivateState, deactivateAction, deactivatePending] = useActionState(
    desactivarProducto,
    INIT
  )
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const isPending = upsertPending || deactivatePending
  const error = upsertState.error ?? deactivateState.error
  const title = mode === 'create' ? 'Nuevo producto' : 'Editar producto'

  useEffect(() => {
    if (upsertState.success || deactivateState.success) onClose()
  }, [upsertState.success, deactivateState.success, onClose])

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
        aria-label={title}
        className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">{title}</h2>
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

        {/* Confirmación de desactivación */}
        {confirmDeactivate ? (
          <div className="px-5 py-6">
            <p className="mb-1 text-sm font-medium">¿Desactivar este producto?</p>
            <p className="mb-5 text-[13px] text-muted-foreground">
              Ya no aparecerá en el inventario. Los movimientos históricos se conservan.
            </p>
            <form action={deactivateAction} className="flex items-center gap-3">
              <input type="hidden" name="id" value={produit?.id} />
              <button
                type="button"
                onClick={() => setConfirmDeactivate(false)}
                disabled={deactivatePending}
                className="h-10 flex-1 rounded-lg border border-border text-sm font-medium transition hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deactivatePending}
                className="h-10 flex-1 rounded-lg bg-destructive text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {deactivatePending ? 'Desactivando…' : 'Sí, desactivar'}
              </button>
            </form>
            {deactivateState.error && (
              <p className="mt-3 text-[13px] text-destructive">{deactivateState.error}</p>
            )}
          </div>
        ) : (
          /* Formulario principal */
          <form action={upsertAction}>
            {mode === 'edit' && produit && (
              <input type="hidden" name="id" value={produit.id} />
            )}

            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Nombre */}
              <Field label="Nombre *">
                <input
                  name="nom"
                  required
                  defaultValue={produit?.nom ?? ''}
                  placeholder="Ej. Tomate cherry"
                  className={inputCls}
                />
              </Field>

              {/* Unidad | Presentación */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Unidad *">
                  <Combobox
                    name="unite"
                    required
                    options={UNIT_OPTS}
                    defaultValue={produit?.unite ?? ''}
                    placeholder="kg, L, unidad…"
                    className={inputCls}
                  />
                </Field>
                <Field label="Presentación">
                  <input
                    name="presentation"
                    defaultValue={produit?.presentation ?? ''}
                    placeholder="caja, saco, tarima…"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Categoría | Proveedor — escribe uno nuevo para crearlo */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Categoría">
                  <Combobox
                    name="categorie_nom"
                    options={categories.map((c) => c.nom)}
                    defaultValue={produit?.categories?.nom ?? ''}
                    placeholder="Elige o escribe una nueva"
                    className={inputCls}
                  />
                </Field>
                <Field label="Proveedor">
                  <Combobox
                    name="fournisseur_nom"
                    options={fournisseurs.map((f) => f.nom)}
                    defaultValue={produit?.fournisseurs?.nom ?? ''}
                    placeholder="Elige o escribe uno nuevo"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Stock */}
              <div
                className={`grid gap-4 ${mode === 'create' ? 'grid-cols-3' : 'grid-cols-2'}`}
              >
                {mode === 'create' && (
                  <Field label="Stock inicial">
                    <input
                      type="number"
                      name="stock_actuel"
                      min="0"
                      step="0.01"
                      defaultValue={0}
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                )}
                <Field label="Stock mínimo">
                  <input
                    type="number"
                    name="stock_minimum"
                    min="0"
                    step="0.01"
                    defaultValue={produit?.stock_minimum ?? 0}
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Stock máximo">
                  <input
                    type="number"
                    name="stock_maximum"
                    min="0"
                    step="0.01"
                    defaultValue={produit?.stock_maximum ?? ''}
                    placeholder="—"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
              </div>

              {/* Precio | Vencimiento */}
              <div className="grid grid-cols-2 gap-4">
                {canSeeFinance && (
                  <Field label="Precio unitario (Q)">
                    <input
                      type="number"
                      name="valeur_unitaire"
                      min="0"
                      step="0.01"
                      defaultValue={produit?.valeur_unitaire ?? 0}
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                )}
                <Field label="Fecha de vencimiento">
                  <input
                    type="date"
                    name="date_peremption"
                    defaultValue={produit?.date_peremption?.split('T')[0] ?? ''}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* Erreur */}
            {error && <p className="px-5 pb-2 text-[13px] text-destructive">{error}</p>}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-4">
              <div>
                {mode === 'edit' && canDeactivate && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeactivate(true)}
                    className="text-[13px] font-medium text-destructive hover:underline"
                  >
                    Desactivar producto
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
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
                  {isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
