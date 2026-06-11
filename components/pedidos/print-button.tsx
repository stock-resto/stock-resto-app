'use client'

import { Icon } from '@/components/icon'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      <Icon name="printer" size={16} />
      Imprimir / Guardar PDF
    </button>
  )
}
