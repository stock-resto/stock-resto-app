'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { money } from '@/lib/format'
import type { Produit } from '@/types/database'

export type ProduitRow = Produit & {
  categories: { nom: string } | null
  fournisseurs: { nom: string } | null
}

type StockStatus = 'ok' | 'low' | 'out'

function stockStatus(p: ProduitRow): StockStatus {
  if (p.stock_actuel <= 0) return 'out'
  if (p.stock_actuel < p.stock_minimum) return 'low'
  return 'ok'
}

const STATUS = {
  ok: { label: 'En stock', tone: 'ok' as const },
  low: { label: 'Stock bajo', tone: 'warn' as const },
  out: { label: 'Agotado', tone: 'danger' as const },
}

export function StockTable({
  produits,
  categories,
  canSeeFinance,
}: {
  produits: ProduitRow[]
  categories: { id: string; nom: string }[]
  canSeeFinance: boolean
}) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return produits.filter((p) => {
      const okCat = cat === 'all' || p.categorie_id === cat
      const okQ = !q || p.nom.toLowerCase().includes(q)
      return okCat && okQ
    })
  }, [produits, query, cat])

  const lowCount = produits.filter((p) => stockStatus(p) !== 'ok').length
  const totalValue = produits.reduce(
    (s, p) => s + p.stock_actuel * p.valeur_unitaire,
    0
  )

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-bold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado del stock en tiempo real
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Próximamente"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground opacity-60 shadow-sm"
        >
          <Icon name="plus" size={17} />
          Nuevo producto
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <StatCard icon="box" tone="neutral" label="Productos" value={String(produits.length)} foot="artículos" />
        <StatCard
          icon="alert"
          tone={lowCount ? 'warn' : 'ok'}
          label="Productos en alerta"
          value={String(lowCount)}
          foot="alertas de stock"
        />
        {canSeeFinance && (
          <StatCard icon="trend" tone="accent" label="Valor del stock" value={money(totalValue)} />
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 min-w-[200px] max-w-[340px] flex-1 items-center gap-2.5 rounded-lg border border-border bg-card px-3">
          <Icon name="search" size={17} className="text-muted-foreground/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          <Seg active={cat === 'all'} onClick={() => setCat('all')}>
            Todas
          </Seg>
          {categories.map((c) => (
            <Seg key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.nom}
            </Seg>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th>Proveedor</Th>
                <Th>Presentación</Th>
                {canSeeFinance && <Th align="right">Precio unit.</Th>}
                <Th className="w-[200px]">En stock</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = stockStatus(p)
                return (
                  <tr key={p.id} className="border-b border-border transition last:border-0 hover:bg-secondary">
                    <td className="px-[18px] py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold">{p.nom}</span>
                        {p.categories?.nom && (
                          <span className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {p.categories.nom}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-[18px] py-3 text-muted-foreground">
                      {p.fournisseurs?.nom ?? '—'}
                    </td>
                    <td className="px-[18px] py-3 text-muted-foreground">
                      {p.presentation ? `${p.presentation} · ` : ''}
                      <span className="font-mono">{p.unite}</span>
                    </td>
                    {canSeeFinance && (
                      <td className="px-[18px] py-3 text-right font-mono">
                        {money(p.valeur_unitaire)}
                      </td>
                    )}
                    <td className="px-[18px] py-3">
                      <div className="flex items-center gap-3">
                        <span className="min-w-[52px] font-mono text-[13.5px] font-semibold">
                          {p.stock_actuel}
                          <em className="ml-0.5 not-italic text-[11px] text-muted-foreground/70">
                            {p.unite}
                          </em>
                        </span>
                        <StockBar p={p} status={status} />
                      </div>
                    </td>
                    <td className="px-[18px] py-3">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 px-5 py-12 text-muted-foreground/70">
            <Icon name="box" size={28} />
            <span className="text-sm">Sin resultados</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Th({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode
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

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-medium transition ' +
        (active
          ? 'border-foreground bg-foreground font-semibold text-background'
          : 'border-border bg-card text-muted-foreground hover:text-foreground')
      }
    >
      {children}
    </button>
  )
}

const TONE_CLASSES = {
  ok: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_12%,transparent)]',
  warn: 'text-[var(--warn)] bg-[color-mix(in_oklch,var(--warn)_16%,transparent)]',
  danger: 'text-destructive bg-destructive/10',
}

function StatusBadge({ status }: { status: StockStatus }) {
  const { label, tone } = STATUS[status]
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ' +
        TONE_CLASSES[tone]
      }
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

const BAR_FILL: Record<StockStatus, string> = {
  ok: 'bg-[var(--ok)]',
  low: 'bg-[var(--warn)]',
  out: 'bg-destructive',
}

function StockBar({ p, status }: { p: ProduitRow; status: StockStatus }) {
  const max = p.stock_maximum && p.stock_maximum > 0 ? p.stock_maximum : null
  const pct = max
    ? Math.max(0, Math.min(100, (p.stock_actuel / max) * 100))
    : p.stock_actuel > 0
      ? 100
      : 0
  const minPct = max ? Math.max(0, Math.min(100, (p.stock_minimum / max) * 100)) : 0
  return (
    <div className="flex-1" title={max ? `${p.stock_actuel} / ${max}` : String(p.stock_actuel)}>
      <div className="relative h-[7px] overflow-hidden rounded border border-border bg-secondary">
        <div
          className={'absolute inset-y-0 left-0 rounded ' + BAR_FILL[status]}
          style={{ width: pct + '%' }}
        />
        {minPct > 0 && (
          <div
            className="absolute -inset-y-0.5 z-10 w-0.5 bg-border"
            style={{ left: minPct + '%' }}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  tone,
  label,
  value,
  foot,
}: {
  icon: 'box' | 'alert' | 'trend'
  tone: 'neutral' | 'warn' | 'ok' | 'accent'
  label: string
  value: string
  foot?: string
}) {
  const toneCls = {
    neutral: 'bg-secondary text-muted-foreground',
    warn: 'text-[var(--warn)] bg-[color-mix(in_oklch,var(--warn)_16%,transparent)]',
    ok: 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_13%,transparent)]',
    accent: 'text-primary bg-primary/10',
  }[tone]
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-[17px] shadow-sm">
      <div className={'grid size-9 place-items-center rounded-[10px] ' + toneCls}>
        <Icon name={icon} size={18} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-[22px] font-bold tracking-tight">{value}</span>
        {foot && <span className="text-[11.5px] text-muted-foreground/70">{foot}</span>}
      </div>
    </div>
  )
}
