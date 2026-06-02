'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/icon'
import { logout } from '@/lib/auth/actions'
import {
  CrearSolicitudOverlay,
  type CuisinierProducto,
} from './crear-solicitud-overlay'

type NavItem = { href: string; label: string; icon: IconName }

const NAV: NavItem[] = [
  { href: '/stock', label: 'Stock', icon: 'box' },
  { href: '/demandes', label: 'Solicitudes', icon: 'clipboard' },
]

function initials(nom: string) {
  return nom
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function CuisinierShell({
  nom,
  productos,
  children,
}: {
  nom: string
  productos: CuisinierProducto[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [createOpen, setCreateOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const onSent = useCallback(() => {
    setCreateOpen(false)
    setToast('Solicitud enviada')
    setTimeout(() => setToast(null), 2400)
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const firstName = nom.split(' ')[0]

  return (
    <div className="flex h-[100dvh] flex-col bg-background md:flex-row">
      {/* ─── Sidebar (desktop ≥ md) ─── */}
      <aside className="hidden w-60 shrink-0 flex-col gap-2 border-r border-border bg-card p-3.5 md:flex">
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
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
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
              <span className="text-[11px] text-muted-foreground">Cocinero</span>
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

      {/* ─── Greeting (mobile < md) ─── */}
      <header
        className="flex shrink-0 items-center justify-between px-5 pb-3 md:hidden"
        style={{ paddingTop: 'calc(14px + env(safe-area-inset-top))' }}
      >
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xl font-bold tracking-tight">Hola, {firstName}</span>
          <span className="truncate text-[12.5px] text-muted-foreground">Cocinero · {firstName}</span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full bg-primary text-[15px] font-bold text-primary-foreground"
            aria-label="Cuenta"
          >
            {initials(nom)}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  <Icon name="logout" size={17} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* ─── Contenu (commun) ─── */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>

      {/* ─── Tab bar (mobile < md) ─── */}
      <nav
        className="relative flex shrink-0 items-start justify-between border-t border-border bg-card/90 px-8 pt-2 backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
      >
        <TabLink href="/stock" label="Stock" icon="box" active={pathname.startsWith('/stock')} />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="absolute left-1/2 top-[-18px] grid size-[60px] -translate-x-1/2 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition active:scale-95"
          aria-label="Nueva solicitud"
        >
          <Icon name="plus" size={26} />
        </button>
        <TabLink
          href="/demandes"
          label="Solicitudes"
          icon="clipboard"
          active={pathname.startsWith('/demandes')}
        />
      </nav>

      {/* ─── Overlay création (mobile) ─── */}
      <div className="md:hidden">
        <CrearSolicitudOverlay
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSent={onSent}
          productos={productos}
        />
      </div>

      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg">
          <span className="grid size-5 place-items-center rounded-full bg-primary">
            <Icon name="check" size={13} className="text-primary-foreground" />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}

function TabLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: IconName
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={
        'flex max-w-[120px] flex-1 flex-col items-center gap-0.5 pt-1 text-[11px] font-semibold transition ' +
        (active ? 'text-primary' : 'text-muted-foreground/70')
      }
    >
      <Icon name={icon} size={23} />
      <span>{label}</span>
    </Link>
  )
}
