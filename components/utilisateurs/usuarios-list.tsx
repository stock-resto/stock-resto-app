'use client'

import { useCallback, useState } from 'react'
import { Icon } from '@/components/icon'
import { UsuarioModal } from './usuario-modal'

export type UsuarioRow = {
  id: string
  nom: string
  username: string | null
  role: string
  actif: boolean
  created_at: string
}

const ROL = {
  patron:       { label: 'Dueño',     cls: 'text-primary bg-primary/10' },
  gestionnaire: { label: 'Bodeguero', cls: 'text-[var(--info)] bg-[color-mix(in_oklch,var(--info)_15%,transparent)]' },
  cuisinier:    { label: 'Cocinero',  cls: 'bg-secondary text-muted-foreground' },
} as const

export function UsuariosList({
  usuarios,
  patronId,
}: {
  usuarios: UsuarioRow[]
  patronId: string
}) {
  const [newOpen, setNewOpen] = useState(false)
  const [editing, setEditing] = useState<UsuarioRow | null>(null)

  const handleCloseNew = useCallback(() => setNewOpen(false), [])
  const handleCloseEdit = useCallback(() => setEditing(null), [])

  const activos = usuarios.filter((u) => u.actif).length

  return (
    <>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[18px] px-5 py-7 md:px-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[25px] font-bold tracking-tight">Usuarios</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activos} usuario{activos !== 1 ? 's' : ''} activo{activos !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Icon name="plus" size={17} />
            Nuevo usuario
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Usuario</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const rol = ROL[u.role as keyof typeof ROL] ?? ROL.cuisinier
                  const isPatron = u.id === patronId
                  return (
                    <tr
                      key={u.id}
                      className="group border-b border-border last:border-0 hover:bg-secondary"
                    >
                      <td className="px-[18px] py-3 font-medium">{u.nom}</td>
                      <td className="px-[18px] py-3 font-mono text-[13px] text-muted-foreground">
                        {u.username ?? '—'}
                      </td>
                      <td className="px-[18px] py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${rol.cls}`}>
                          {rol.label}
                        </span>
                      </td>
                      <td className="px-[18px] py-3">
                        <span
                          className={
                            'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold ' +
                            (u.actif
                              ? 'text-[var(--ok)] bg-[color-mix(in_oklch,var(--ok)_12%,transparent)]'
                              : 'text-muted-foreground bg-secondary')
                          }
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {u.actif ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {!isPatron && (
                          <button
                            type="button"
                            onClick={() => setEditing(u)}
                            className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100"
                            aria-label={`Editar ${u.nom}`}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {newOpen && (
        <UsuarioModal key="nuevo-usuario" mode="create" onClose={handleCloseNew} />
      )}
      {editing && (
        <UsuarioModal
          key={`edit-${editing.id}`}
          mode="edit"
          usuario={editing}
          onClose={handleCloseEdit}
        />
      )}
    </>
  )
}

function Th({
  children,
  className = '',
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={
        'border-b border-border px-[18px] py-3 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground/70 ' +
        className
      }
    >
      {children}
    </th>
  )
}
