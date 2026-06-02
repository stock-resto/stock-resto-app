'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { day, dateTime } from '@/lib/format'
import type { DemandeRow } from '@/components/demandes/demandes-list'

const STATUT = {
  en_attente: {
    label: 'En espera',
    pill: 'text-[var(--warn)] bg-[color-mix(in_oklch,var(--warn)_16%,transparent)]',
    color: 'var(--warn)',
  },
  approuvee: {
    label: 'Aprobada',
    pill: 'text-[var(--info)] bg-[color-mix(in_oklch,var(--info)_15%,transparent)]',
    color: 'var(--info)',
  },
  rejetee: {
    label: 'Rechazada',
    pill: 'text-destructive bg-destructive/10',
    color: 'var(--destructive)',
  },
  livree: {
    label: 'Entregada',
    pill: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_13%,transparent)]',
    color: 'var(--ok)',
  },
} as const

type Filtro = 'all' | keyof typeof STATUT

const FILTERS: { v: Filtro; l: string }[] = [
  { v: 'all', l: 'Todas' },
  { v: 'en_attente', l: 'En espera' },
  { v: 'approuvee', l: 'Aprobada' },
  { v: 'rejetee', l: 'Rechazada' },
  { v: 'livree', l: 'Entregada' },
]

function ref(numero: number) {
  return 'DEM-' + String(numero).padStart(4, '0')
}

export function DemandesMobile({ demandes }: { demandes: DemandeRow[] }) {
  const [f, setF] = useState<Filtro>('all')
  const [detail, setDetail] = useState<DemandeRow | null>(null)

  const rows = useMemo(
    () =>
      demandes
        .filter((d) => f === 'all' || d.statut === f)
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [demandes, f]
  )

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background px-5 pb-2.5 pt-2">
        <h1 className="text-[27px] font-bold tracking-tight">Solicitudes</h1>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setF(c.v)}
              className={
                'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ' +
                (f === c.v
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground')
              }
            >
              {c.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-1">
        {rows.map((d) => {
          const s = STATUT[d.statut as keyof typeof STATUT] ?? STATUT.en_attente
          const qty = d.demande_lignes.reduce((acc, l) => acc + l.quantite, 0)
          const names = d.demande_lignes
            .map((l) => l.produits?.nom)
            .filter(Boolean) as string[]
          const preview =
            names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '')
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setDetail(d)}
              style={{ borderLeftColor: s.color }}
              className="flex w-full flex-col gap-2.5 rounded-2xl border border-l-[3px] border-border bg-card p-3.5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold">{ref(d.numero)}</span>
                <span
                  className={
                    'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ' +
                    s.pill
                  }
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {s.label}
                </span>
              </div>
              <div className="text-[13.5px] leading-snug text-muted-foreground">{preview}</div>
              <div className="flex items-center gap-2.5 border-t border-border pt-2.5">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                  <Icon name="clock" size={13} />
                  {day(d.created_at)}
                </span>
                <span className="ml-auto text-[12.5px] text-muted-foreground">
                  {d.demande_lignes.length} art. · <span className="font-mono">{qty}</span>
                </span>
                <Icon name="chevronRight" size={16} className="text-muted-foreground/50" />
              </div>
            </button>
          )
        })}
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-muted-foreground/60">
            <Icon name="clipboard" size={26} />
            <span className="text-sm">Sin solicitudes</span>
          </div>
        )}
      </div>

      {detail && <DetailSheet d={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function DetailSheet({ d, onClose }: { d: DemandeRow; onClose: () => void }) {
  const s = STATUT[d.statut as keyof typeof STATUT] ?? STATUT.en_attente
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-end bg-black/35"
      onClick={onClose}
    >
      <div
        className="flex max-h-[78%] flex-col gap-3.5 rounded-t-[26px] bg-card px-5 pt-2.5"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-[5px] w-9 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-lg font-bold">{ref(d.numero)}</span>
            <span className="mt-0.5 text-[13px] text-muted-foreground">{dateTime(d.created_at)}</span>
          </div>
          <span
            className={
              'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ' +
              s.pill
            }
          >
            <span className="size-1.5 rounded-full bg-current" />
            {s.label}
          </span>
        </div>

        {d.note && (
          <div className="flex items-start gap-2 rounded-xl bg-secondary px-3.5 py-3 text-[13.5px] leading-snug">
            <Icon name="clipboard" size={14} className="mt-0.5 shrink-0 text-primary" />
            {d.note}
          </div>
        )}

        <div className="flex flex-col overflow-y-auto">
          {d.demande_lignes.map((l) => {
            const livree = d.statut === 'livree' && l.quantite_livree != null
            return (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 border-b border-border py-3.5 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {l.produits?.nom ?? '—'}
                </span>
                <span className="font-mono text-[15px] font-bold">
                  {livree ? `${l.quantite_livree}/${l.quantite}` : l.quantite}
                  <em className="ml-0.5 text-[11px] font-medium not-italic text-muted-foreground/70">
                    {l.produits?.unite}
                  </em>
                </span>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-11 shrink-0 rounded-xl border border-border text-sm font-semibold transition hover:bg-secondary"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
