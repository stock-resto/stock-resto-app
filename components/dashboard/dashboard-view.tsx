'use client'

import Link from 'next/link'
import { Icon, type IconName } from '@/components/icon'
import { money, dateTime } from '@/lib/format'

export type MouvementRecent = {
  id: string
  type: string
  quantite: number
  created_at: string
  produits: { nom: string; unite: string } | null
  users: { nom: string } | null
}

export type ProduitAlerta = {
  nom: string
  unite: string
  stock_actuel: number
  stock_minimum: number
  categories: { nom: string } | null
}

export type DemandeResumen = {
  id: string
  numero: number
  created_at: string
  cuisinier: { nom: string } | null
  demande_lignes: { id: string }[]
}

// ─── Stat card ──────────────────────────────────────────────────────────────

type StatColor = 'green' | 'orange' | 'red' | 'blue' | 'muted'

const colorMap: Record<StatColor, { bg: string; text: string }> = {
  green:  { bg: 'bg-[color-mix(in_oklch,var(--ok)_12%,transparent)]',  text: 'text-[var(--ok)]' },
  orange: { bg: 'bg-[color-mix(in_oklch,var(--warn)_12%,transparent)]', text: 'text-[var(--warn)]' },
  red:    { bg: 'bg-destructive/10',                                      text: 'text-destructive' },
  blue:   { bg: 'bg-[color-mix(in_oklch,var(--info)_12%,transparent)]', text: 'text-[var(--info)]' },
  muted:  { bg: 'bg-secondary',                                           text: 'text-muted-foreground' },
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: IconName
  label: string
  value: string
  sub?: string
  color: StatColor
  href?: string
}) {
  const { bg, text } = colorMap[color]
  const inner = (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
      <div className={`flex size-10 items-center justify-center rounded-lg ${bg} ${text}`}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

// ─── Dashboard view ──────────────────────────────────────────────────────────

export function DashboardView({
  isPatron,
  nom,
  valorTotal,
  alertaCount,
  agotadoCount,
  enEsperaCount,
  pedidosEnCurso,
  enAlerta,
  pendientes,
  recientes,
}: {
  isPatron: boolean
  nom: string
  valorTotal: number
  alertaCount: number
  agotadoCount: number
  enEsperaCount: number
  pedidosEnCurso: number
  enAlerta: ProduitAlerta[]
  pendientes: DemandeResumen[]
  recientes: MouvementRecent[]
}) {
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const fecha = new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const showGrid = pendientes.length > 0 || enAlerta.length > 0

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-7 md:px-8">

      {/* Header */}
      <div>
        <h1 className="text-[25px] font-bold tracking-tight">{saludo}, {nom}</h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{fecha}</p>
      </div>

      {/* Stat cards */}
      <div className={`grid gap-4 sm:grid-cols-2 ${isPatron ? 'xl:grid-cols-4' : 'lg:grid-cols-3'}`}>
        {isPatron && (
          <StatCard
            icon="trend"
            label="Valor del inventario"
            value={money(valorTotal)}
            color="green"
          />
        )}
        <StatCard
          icon="alert"
          label="Productos en alerta"
          value={String(alertaCount + agotadoCount)}
          sub={(alertaCount + agotadoCount) === 1 ? 'producto' : 'productos'}
          color={(alertaCount + agotadoCount) > 0 ? 'orange' : 'muted'}
          href="/stock"
        />
        <StatCard
          icon="clipboard"
          label="Solicitudes pendientes"
          value={String(enEsperaCount)}
          sub={enEsperaCount === 1 ? 'por tratar' : 'por tratar'}
          color={enEsperaCount > 0 ? 'blue' : 'muted'}
          href="/demandes"
        />
        <StatCard
          icon="cart"
          label="Pedidos en curso"
          value={String(pedidosEnCurso)}
          sub="con proveedores"
          color={pedidosEnCurso > 0 ? 'blue' : 'muted'}
          href="/pedidos"
        />
      </div>

      {/* 2 colonnes : Por tratar + Productos en alerta */}
      {showGrid && (
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Por tratar */}
          <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold">Por tratar</h2>
              <Link href="/demandes" className="text-sm text-primary hover:underline">
                Ver todo →
              </Link>
            </div>
            {pendientes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/60">
                <Icon name="clipboard" size={22} />
                <span className="text-sm">Sin solicitudes pendientes</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {pendientes.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="font-mono text-sm font-bold">
                      DEM-{String(d.numero).padStart(4, '0')}
                    </span>
                    <span className="flex-1 truncate text-sm text-muted-foreground">
                      {d.cuisinier?.nom ?? '—'}
                    </span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {d.demande_lignes.length} art.
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[color-mix(in_oklch,var(--info)_15%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[var(--info)]">
                      Pendiente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Productos en alerta */}
          <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold">Productos en alerta</h2>
              <Link href="/stock" className="text-sm text-primary hover:underline">
                Ver stock →
              </Link>
            </div>
            {enAlerta.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground/60">
                <Icon name="box" size={22} />
                <span className="text-sm">Todo el stock en orden</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col divide-y divide-border">
                  {enAlerta.slice(0, 5).map((p) => {
                    const agotado = p.stock_actuel === 0
                    return (
                      <div key={p.nom} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">{p.nom}</span>
                          <span className="text-xs text-muted-foreground">
                            Mínimo: {p.stock_minimum} {p.unite}
                          </span>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${agotado ? 'text-destructive' : 'text-[var(--warn)]'}`}>
                          {p.stock_actuel} {p.unite}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            agotado
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-[color-mix(in_oklch,var(--warn)_15%,transparent)] text-[var(--warn)]'
                          }`}
                        >
                          {agotado ? 'Agotado' : 'Stock bajo'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-auto border-t border-border p-3">
                  <Link
                    href="/pedidos/preparar"
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    <Icon name="cart" size={17} />
                    Preparar pedidos
                  </Link>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* Movimientos recientes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Movimientos recientes</h2>
          <Link href="/mouvements" className="text-sm text-primary hover:underline">
            Ver movimientos →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {recientes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground/70">
              <Icon name="trend" size={26} />
              <span className="text-sm">Sin movimientos registrados</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                    <th className="px-4 py-3 text-left font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                    <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {dateTime(m.created_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">{m.produits?.nom ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            m.type === 'entree'
                              ? 'bg-[color-mix(in_oklch,var(--ok)_15%,transparent)] text-[var(--ok)]'
                              : 'bg-[color-mix(in_oklch,var(--warn)_15%,transparent)] text-[var(--warn)]'
                          }`}
                        >
                          <Icon name={m.type === 'entree' ? 'arrowDown' : 'arrowUp'} size={11} />
                          {m.type === 'entree' ? 'Entrada' : 'Salida'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {m.type === 'entree' ? '+' : '−'}
                        {m.quantite}{' '}
                        <span className="font-sans text-muted-foreground">{m.produits?.unite}</span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                        {m.users?.nom ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
