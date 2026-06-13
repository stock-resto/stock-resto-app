'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/icon'
import { registrarRecepcion, type PedidoState } from '@/lib/pedidos/actions'

export type LineaPendiente = {
  id: string
  nom: string
  unite: string
  pendiente: number
  pedidaLabel: string
  aprox: boolean
}

type Props = {
  pedidoId: string
  numero: number
  lineas: LineaPendiente[]
  onClose: () => void
}

const INIT: PedidoState = {}

export function RegistrarRecepcionModal({ pedidoId, numero, lineas, onClose }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(registrarRecepcion, INIT)
  const [recibir, setRecibir] = useState<Record<string, string>>(() =>
    Object.fromEntries(lineas.map((l) => [l.id, String(l.pendiente)]))
  )

  const recepcionesJson = JSON.stringify(
    Object.entries(recibir)
      .filter(([, v]) => Number(v) > 0)
      .map(([linea_id, v]) => ({ linea_id, recibir: Number(v) }))
  )

  useEffect(() => {
    if (state.success) {
      router.refresh()
      onClose()
    }
  }, [state.success, router, onClose])

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
        aria-label="Registrar recepción"
        className="flex w-full max-w-[500px] max-h-[88vh] flex-col rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">
            Registrar recepción — <span className="font-mono">PED-{numero}</span>
          </h2>
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
          <input type="hidden" name="pedido_id" value={pedidoId} />
          <input type="hidden" name="recepciones" value={recepcionesJson} />

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {lineas.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.nom}</div>
                  <div className="text-[12px] text-muted-foreground">
                    Pedido: {l.pedidaLabel}
                  </div>
                  <div className="text-[12px] font-medium text-[var(--warn)]">
                    Pendiente: {l.aprox ? '≈ ' : ''}{l.pendiente} {l.unite}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                    Recibir ({l.unite})
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={recibir[l.id] ?? ''}
                    onChange={(e) => setRecibir((p) => ({ ...p, [l.id]: e.target.value }))}
                    className="mt-0.5 h-8 w-24 rounded-lg border border-border bg-background px-2 text-right font-mono text-sm outline-none transition focus:border-ring"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-border px-5 py-4">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Icon name="check" size={14} className="text-[var(--ok)]" />
              El stock se actualiza automáticamente.
            </div>
            {state.error && <p className="text-[13px] text-destructive">{state.error}</p>}
            <div className="flex justify-end gap-3">
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
                className="h-9 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? 'Guardando…' : 'Confirmar recepción'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
