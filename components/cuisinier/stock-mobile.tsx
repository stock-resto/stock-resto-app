'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import type { ProduitRow } from '@/components/stock/stock-table'

type Status = 'ok' | 'low' | 'out'

function status(p: ProduitRow): Status {
  if (p.stock_actuel <= 0) return 'out'
  if (p.stock_actuel < p.stock_minimum) return 'low'
  return 'ok'
}

const PILL: Record<Status, { label: string; cls: string }> = {
  ok: { label: 'En stock', cls: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_12%,transparent)]' },
  low: { label: 'Stock bajo', cls: 'text-[var(--warn)] bg-[color-mix(in_oklch,var(--warn)_16%,transparent)]' },
  out: { label: 'Agotado', cls: 'text-destructive bg-destructive/10' },
}

const BAR: Record<Status, string> = {
  ok: 'bg-[var(--ok)]',
  low: 'bg-[var(--warn)]',
  out: 'bg-destructive',
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function StockMobile({
  produits,
  categories,
}: {
  produits: ProduitRow[]
  categories: { id: string; nom: string }[]
}) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  const list = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean)
    return produits.filter((p) => {
      if (cat !== 'all' && p.categorie_id !== cat) return false
      if (tokens.length === 0) return true
      // Botte de foin : nom + categoría + proveedor + presentación + unidad + estado
      const hay = norm(
        [
          p.nom,
          p.categories?.nom ?? '',
          p.fournisseurs?.nom ?? '',
          p.presentation ?? '',
          p.unite,
          PILL[status(p)].label,
        ].join(' ')
      )
      return tokens.every((t) => hay.includes(t))
    })
  }, [produits, q, cat])

  const low = produits.filter((p) => status(p) !== 'ok').length

  return (
    <div className="flex flex-col">
      {/* Head */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-background px-5 pb-2.5 pt-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[27px] font-bold tracking-tight">Stock</h1>
          {low > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[color-mix(in_oklch,var(--warn)_16%,transparent)] px-2.5 py-0.5 text-[13px] font-bold text-[var(--warn)]">
              <Icon name="alert" size={14} />
              {low}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
          <Icon name="search" size={18} className="text-muted-foreground/70" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, proveedor, estado…"
            className="w-full bg-transparent text-base outline-none"
          />
        </div>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip on={cat === 'all'} onClick={() => setCat('all')}>
            Todas
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>
              {c.nom}
            </Chip>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-1">
        {list.map((p) => {
          const st = status(p)
          const max = p.stock_maximum && p.stock_maximum > 0 ? p.stock_maximum : null
          const pct = max
            ? Math.max(4, Math.min(100, (p.stock_actuel / max) * 100))
            : p.stock_actuel > 0
              ? 100
              : 4
          return (
            <div
              key={p.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate font-semibold">{p.nom}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {p.fournisseurs?.nom ?? '—'}
                  {p.presentation ? ` · ${p.presentation}` : ''}
                </span>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded border border-border bg-secondary">
                  <div className={'h-full rounded ' + BAR[st]} style={{ width: pct + '%' }} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="font-mono text-base font-bold">
                  {p.stock_actuel}
                  <em className="ml-0.5 text-[11px] font-medium not-italic text-muted-foreground/70">
                    {p.unite}
                  </em>
                </span>
                <span
                  className={
                    'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ' +
                    PILL[st].cls
                  }
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {PILL[st].label}
                </span>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2.5 py-16 text-muted-foreground/60">
            <Icon name="box" size={26} />
            <span className="text-sm">Sin resultados</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ' +
        (on
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card text-muted-foreground')
      }
    >
      {children}
    </button>
  )
}
