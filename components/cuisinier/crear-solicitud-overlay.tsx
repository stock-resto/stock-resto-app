'use client'

import { useActionState, useEffect, useState } from 'react'
import { Icon } from '@/components/icon'
import { crearDemanda, type DemandaState } from '@/lib/demandes/actions'

export type CuisinierProducto = {
  id: string
  nom: string
  unite: string
  stock_actuel: number
  categoria: string | null
}

type Linea = { produit_id: string; quantite: number }

const INIT: DemandaState = {}

export function CrearSolicitudOverlay({
  open,
  onClose,
  onSent,
  productos,
}: {
  open: boolean
  onClose: () => void
  onSent: () => void
  productos: CuisinierProducto[]
}) {
  const [state, formAction, pending] = useActionState(crearDemanda, INIT)
  const [draft, setDraft] = useState<Linea[]>([])
  const [note, setNote] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setDraft([])
      setNote('')
      setPickerOpen(false)
    }
  }, [open])

  // Succès → toast + fermeture
  useEffect(() => {
    if (state.success) onSent()
  }, [state.success, onSent])

  if (!open) return null

  const setQty = (id: string, qty: number) =>
    setDraft((d) => d.map((l) => (l.produit_id === id ? { ...l, quantite: qty } : l)))
  const remove = (id: string) => setDraft((d) => d.filter((l) => l.produit_id !== id))
  const pick = (id: string) => {
    setDraft((d) =>
      d.find((l) => l.produit_id === id)
        ? d.map((l) => (l.produit_id === id ? { ...l, quantite: l.quantite + 1 } : l))
        : [...d, { produit_id: id, quantite: 1 }]
    )
    setPickerOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 pb-3 text-base font-bold"
        style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-[10px] bg-secondary text-muted-foreground"
          aria-label="Cerrar"
        >
          <Icon name="x" size={20} />
        </button>
        <span>Nueva solicitud</span>
        <span className="w-9" />
      </div>

      {/* Body */}
      <form action={formAction} className="flex min-h-0 flex-1 flex-col">
        <input type="hidden" name="lignes" value={JSON.stringify(draft)} />
        <input type="hidden" name="note" value={note} />

        <div className="flex-1 overflow-y-auto p-4">
          {draft.length === 0 && (
            <div className="flex flex-col items-center gap-3.5 px-6 py-10 text-center">
              <div className="grid size-16 place-items-center rounded-[18px] bg-primary/10">
                <Icon name="clipboard" size={30} className="text-primary" />
              </div>
              <p className="max-w-[240px] text-[14.5px] leading-relaxed text-muted-foreground">
                Añade los productos que necesitas para tu servicio.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {draft.map((l) => {
              const p = productos.find((x) => x.id === l.produit_id)
              if (!p) return null
              return (
                <div
                  key={l.produit_id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{p.nom}</span>
                    <span className="text-xs text-muted-foreground">{p.categoria ?? '—'}</span>
                  </div>
                  <Stepper
                    value={l.quantite}
                    onChange={(v) => setQty(l.produit_id, v)}
                    unit={p.unite}
                  />
                  <button
                    type="button"
                    onClick={() => remove(l.produit_id)}
                    className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-border bg-card text-destructive"
                    aria-label="Quitar"
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-input bg-card py-3.5 text-sm font-semibold text-primary"
          >
            <Icon name="plus" size={18} />
            Agregar producto
          </button>

          <div className="mt-5 flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-muted-foreground">Nota (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Para el servicio de la noche"
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {state.error && <p className="mt-3 text-[13px] text-destructive">{state.error}</p>}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 border-t border-border bg-card px-4 pt-3"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          <button
            type="submit"
            disabled={draft.length === 0 || pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Icon name="check" size={18} />
            {pending
              ? 'Enviando…'
              : `Enviar solicitud${draft.length > 0 ? `  ·  ${draft.length} art.` : ''}`}
          </button>
        </div>
      </form>

      {/* Picker */}
      {pickerOpen && (
        <ProductPicker
          productos={productos}
          draft={draft}
          onPick={pick}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

function Stepper({
  value,
  onChange,
  unit,
  min = 1,
}: {
  value: number
  onChange: (v: number) => void
  unit: string
  min?: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-border bg-secondary p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid size-8 place-items-center rounded-lg bg-card text-foreground shadow-sm disabled:opacity-40"
        aria-label="Menos"
      >
        <Icon name="minus" size={16} />
      </button>
      <span className="min-w-[44px] text-center font-mono text-sm font-semibold">
        {value}
        <em className="ml-0.5 not-italic text-[11px] font-normal text-muted-foreground/70">{unit}</em>
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid size-8 place-items-center rounded-lg bg-card text-foreground shadow-sm"
        aria-label="Más"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

function ProductPicker({
  productos,
  draft,
  onPick,
  onClose,
}: {
  productos: CuisinierProducto[]
  draft: Linea[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const list = q ? productos.filter((p) => norm(p.nom).includes(norm(q))) : productos

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-black/35" onClick={onClose}>
      <div
        className="flex max-h-[88%] flex-col gap-3.5 rounded-t-[26px] bg-card px-5 pt-2.5"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-[5px] w-9 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Agregar producto</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-[10px] bg-secondary text-muted-foreground"
            aria-label="Cerrar"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
          <Icon name="search" size={18} className="text-muted-foreground/70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            autoFocus
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </div>
        <div className="flex flex-col overflow-y-auto">
          {list.map((p) => {
            const added = draft.find((l) => l.produit_id === p.id)
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => onPick(p.id)}
                className="flex items-center gap-3 border-b border-border py-3.5 text-left last:border-0"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{p.nom}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.categoria ?? '—'} ·{' '}
                    <span className="font-mono">
                      {p.stock_actuel}
                      {p.unite}
                    </span>{' '}
                    en stock
                  </span>
                </div>
                {added ? (
                  <span className="rounded-[9px] bg-primary/10 px-2.5 py-1.5 font-mono text-sm font-bold text-primary">
                    ×{added.quantite}
                  </span>
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary/10">
                    <Icon name="plus" size={18} className="text-primary" />
                  </span>
                )}
              </button>
            )
          })}
          {list.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground/60">
              <Icon name="search" size={24} />
              <span className="text-sm">Sin resultados</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
