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

export function DashboardView({
  isPatron,
  nom,
  valorTotal,
  alertaCount,
  agotadoCount,
  enEsperaCount,
  enAlerta,
  recientes,
}: {
  isPatron: boolean
  nom: string
  valorTotal: number
  alertaCount: number
  agotadoCount: number
  enEsperaCount: number
  enAlerta: ProduitAlerta[]
  recientes: MouvementRecent[]
}) {
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const fecha = new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-7 md:px-8">
      <div>
        <h1 className="text-[25px] font-bold tracking-tight">
          {saludo}, {nom}
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{fecha}</p>
      </div>

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
          label="En alerta"
          value={String(alertaCount)}
          sub={alertaCount === 1 ? 'producto' : 'productos'}
          color={alertaCount > 0 ? 'orange' : 'muted'}
          href="/stock"
        />
        <StatCard
          icon="box"
          label="Agotados"
          value={String(agotadoCount)}
          sub={agotadoCount === 1 ? 'producto' : 'productos'}
          color={agotadoCount > 0 ? 'red' : 'muted'}
          href="/stock"
        />
        <StatCard
          icon="clipboard"
          label="En espera"
          value={String(enEsperaCount)}
          sub={enEsperaCount === 1 ? 'solicitud' : 'solicitudes'}
          color={enEsperaCount > 0 ? 'blue' : 'muted'}
          href="/demandes"
        />
      </div>

      {enAlerta.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Productos en alerta</h2>
            <Link href="/stock" className="text-sm text-primary hover:underline">
              Ver stock →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Producto</th>
                    <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Categoría</th>
                    <th className="px-4 py-3 text-right font-medium">Stock actual</th>
                    <th className="px-4 py-3 text-right font-medium">Mínimo</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {enAlerta.map((p) => {
                    const agotado = p.stock_actuel === 0
                    return (
                      <tr
                        key={p.nom}
                        className="border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
                      >
                        <td className="px-4 py-3 font-medium">{p.nom}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {p.categories?.nom ?? '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${agotado ? 'text-destructive' : 'text-[var(--warn)]'}`}>
                          {p.stock_actuel} {p.unite}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {p.stock_minimum} {p.unite}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              agotado
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-[color-mix(in_oklch,var(--warn)_15%,transparent)] text-[var(--warn)]'
                            }`}
                          >
                            <Icon name="alert" size={11} />
                            {agotado ? 'Agotado' : 'Bajo'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Movimientos recientes</h2>
          <Link href="/mouvements" className="text-sm text-primary hover:underline">
            Ver historial →
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
