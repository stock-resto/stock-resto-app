'use client'

import { useCallback, useMemo, useState } from 'react'
import { Icon } from '@/components/icon'
import { dateTime } from '@/lib/format'
import { EntradaModal, type ProductoOption } from './entrada-modal'
import { SortieModal } from './sortie-modal'
import { MovimientoEditModal, type MovimientoEditable } from './movimiento-edit-modal'

export type MouvementRow = MovimientoEditable & {
  created_at: string
  users: { nom: string } | null
}

type Tipo = 'all' | 'entree' | 'sortie'
type Periodo = '7j' | '30j' | 'all'

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: '7j', label: '7 días' },
  { key: '30j', label: '30 días' },
  { key: 'all', label: 'Todo' },
]

export function MouvementsList({
  mouvements,
  produits,
  canEdit,
  canPatron,
}: {
  mouvements: MouvementRow[]
  produits: ProductoOption[]
  canEdit: boolean
  canPatron: boolean
}) {
  const [tipo, setTipo] = useState<Tipo>('all')
  const [search, setSearch] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('30j')

  const [entradaOpen, setEntradaOpen] = useState(false)
  const [sortieOpen, setSortieOpen] = useState(false)
  const [editing, setEditing] = useState<MouvementRow | null>(null)

  const closeEntrada = useCallback(() => setEntradaOpen(false), [])
  const closeSortie = useCallback(() => setSortieOpen(false), [])
  const closeEdit = useCallback(() => setEditing(null), [])

  const filtered = useMemo(() => {
    const now = Date.now()
    const cutoff =
      periodo === '7j'
        ? now - 7 * 24 * 3600 * 1000
        : periodo === '30j'
          ? now - 30 * 24 * 3600 * 1000
          : null
    const q = search.toLowerCase()

    return mouvements.filter((m) => {
      if (tipo !== 'all' && m.type !== tipo) return false
      if (cutoff && new Date(m.created_at).getTime() < cutoff) return false
      if (q && !(m.produits?.nom ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [mouvements, tipo, search, periodo])

  return (
    <>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">Movimientos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registro completo de entradas y salidas
            </p>
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEntradaOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Icon name="arrowDown" size={17} />
                Nueva entrada
              </button>
              <button
                type="button"
                onClick={() => setSortieOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Icon name="arrowUp" size={17} />
                Nueva salida
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tipo */}
          <div className="flex gap-0.5 rounded-lg border border-border bg-secondary p-1">
            {(['all', 'entree', 'sortie'] as Tipo[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                  tipo === t
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'entree' ? 'Entradas' : 'Salidas'}
              </button>
            ))}
          </div>

          {/* Periodo */}
          <div className="flex gap-0.5 rounded-lg border border-border bg-secondary p-1">
            {PERIODOS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriodo(key)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                  periodo === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div className="relative min-w-[180px] flex-1 max-w-[280px]">
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-16 text-muted-foreground/70">
              <Icon name="search" size={26} />
              <span className="text-sm">Sin movimientos para estos filtros</span>
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
                    <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Notas</th>
                    <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Usuario</th>
                    {canPatron && <th className="w-10 px-3 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className="group border-b border-border last:border-0 transition-colors hover:bg-secondary/50"
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
                      <td className="hidden max-w-[220px] truncate px-4 py-3 text-muted-foreground sm:table-cell">
                        {m.notes ?? '—'}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                        {m.users?.nom ?? '—'}
                      </td>
                      {canPatron && (
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setEditing(m)}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                            aria-label="Corregir movimiento"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {entradaOpen && (
        <EntradaModal key="entrada-modal" produits={produits} onClose={closeEntrada} />
      )}
      {sortieOpen && (
        <SortieModal key="sortie-modal" produits={produits} onClose={closeSortie} />
      )}
      {editing && (
        <MovimientoEditModal key={`edit-${editing.id}`} mouvement={editing} onClose={closeEdit} />
      )}
    </>
  )
}
