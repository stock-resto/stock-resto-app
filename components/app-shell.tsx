'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/icon'
import { logout } from '@/lib/auth/actions'
import type { Role } from '@/types/database'

type NavItem = { href: string; label: string; icon: IconName }

const NAV: Record<Role, NavItem[]> = {
  patron: [
    { href: '/dashboard', label: 'Panel', icon: 'dashboard' },
    { href: '/stock', label: 'Stock', icon: 'box' },
    { href: '/entrees', label: 'Entradas', icon: 'arrowDown' },
    { href: '/sorties', label: 'Salidas', icon: 'arrowUp' },
    { href: '/mouvements', label: 'Historial', icon: 'trend' },
    { href: '/demandes', label: 'Solicitudes', icon: 'clipboard' },
    { href: '/pedidos', label: 'Pedidos', icon: 'cart' },
    { href: '/utilisateurs', label: 'Usuarios', icon: 'users' },
  ],
  gestionnaire: [
    { href: '/dashboard', label: 'Panel', icon: 'dashboard' },
    { href: '/stock', label: 'Stock', icon: 'box' },
    { href: '/entrees', label: 'Entradas', icon: 'arrowDown' },
    { href: '/sorties', label: 'Salidas', icon: 'arrowUp' },
    { href: '/mouvements', label: 'Historial', icon: 'trend' },
    { href: '/demandes', label: 'Solicitudes', icon: 'clipboard' },
    { href: '/pedidos', label: 'Pedidos', icon: 'cart' },
  ],
  cuisinier: [
    { href: '/stock', label: 'Stock', icon: 'box' },
    { href: '/demandes', label: 'Solicitudes', icon: 'clipboard' },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  patron: 'Dueño',
  gestionnaire: 'Bodeguero',
  cuisinier: 'Cocinero',
}

function initials(nom: string) {
  return nom
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AppShell({
  nom,
  role,
  children,
}: {
  nom: string
  role: Role
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = NAV[role]
  const current = items.find((i) => pathname.startsWith(i.href))

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={
          'fixed inset-y-0 left-0 z-60 flex w-60 flex-col gap-2 border-r border-border bg-card p-3.5 transition-transform md:static md:translate-x-0 ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid size-9 place-items-center rounded-[11px] bg-primary text-primary-foreground">
            <Icon name="box" size={20} />
          </span>
          <div className="flex flex-col leading-tight">
            <strong className="text-sm font-bold tracking-tight">Mise en Place</strong>
            <span className="text-[11px] text-muted-foreground">Gestión de inventario</span>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ' +
                  (active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground')
                }
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-secondary p-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials(nom)}
            </span>
            <div className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate text-[13px] font-semibold">{nom}</strong>
              <span className="text-[11px] text-muted-foreground">{ROLE_LABEL[role]}</span>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Icon name="logout" size={19} />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Scrim mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-55 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Abrir menú"
          >
            <Icon name="menu" size={20} />
          </button>
          <span className="text-sm font-semibold tracking-tight">
            {current?.label ?? 'Mise en Place'}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
