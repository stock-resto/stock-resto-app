// Formatage espagnol (Guatemala) — devise quetzal (GTQ, symbole Q).

const moneyFmt = new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  maximumFractionDigits: 2,
})

export function money(n: number): string {
  return moneyFmt.format(n)
}

const dateFmt = new Intl.DateTimeFormat('es-GT', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function dateTime(iso: string): string {
  return dateFmt.format(new Date(iso))
}

const dayFmt = new Intl.DateTimeFormat('es-GT', {
  day: '2-digit',
  month: 'short',
})

export function day(iso: string): string {
  return dayFmt.format(new Date(iso))
}
