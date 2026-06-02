'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/icon'

// Minuscule + sans accents : filtrage tolérant (piña = pina)
function norm(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

type Row = { label: string; value: string; create?: boolean }

/**
 * Combobox : champ texte + liste déroulante custom.
 * Contrairement au <datalist> natif, la liste complète s'affiche au focus
 * même si le champ contient déjà une valeur. Propose "Crear «...»" si le
 * texte tapé n'existe pas. La valeur est soumise via un <input name> réel.
 */
export function Combobox({
  name,
  options,
  defaultValue = '',
  placeholder,
  className,
  required = false,
  allowCreate = true,
}: {
  name: string
  options: string[]
  defaultValue?: string
  placeholder?: string
  className?: string
  required?: boolean
  allowCreate?: boolean
}) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const rows = useMemo<Row[]>(() => {
    const q = norm(value.trim())
    const filtered = q ? options.filter((o) => norm(o).includes(q)) : options
    const list: Row[] = filtered.map((o) => ({ label: o, value: o }))
    const exact = options.some((o) => norm(o) === q)
    if (allowCreate && value.trim() !== '' && !exact) {
      list.push({ label: `Crear «${value.trim()}»`, value: value.trim(), create: true })
    }
    return list
  }, [value, options, allowCreate])

  useEffect(() => {
    setHi(0)
  }, [value, open])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function choose(v: string) {
    setValue(v)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(h + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && rows[hi]) {
        e.preventDefault()
        choose(rows[hi].value)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        name={name}
        value={value}
        required={required}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {open && rows.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg">
          {rows.map((r, i) => (
            <li key={r.value + (r.create ? '__c' : '')}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(r.value)
                }}
                onMouseEnter={() => setHi(i)}
                className={
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ' +
                  (i === hi ? 'bg-secondary ' : '') +
                  (r.create ? 'font-medium text-primary' : '')
                }
              >
                {r.create && <Icon name="plus" size={14} />}
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
