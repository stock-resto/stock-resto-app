// Conversions entre l'unité de MESURE de base (ex. kg) et les présentations.
//
// Le stock vit TOUJOURS en unité de base. Une présentation (usage = sac,
// achat = cagette) vaut N unités de base (son « facteur »). Ces helpers ne
// servent qu'à la saisie et à l'affichage — jamais au stockage.

export type ProductUnits = {
  unite: string // mesure de base (kg, L, unidad…)
  unite_uso: string | null // présentation d'usage (saco)
  factor_uso: number | null // nb d'unités de base dans 1 unité d'usage (kg/sac)
}

// Arrondi d'affichage (évite les artefacts type 4.9999999).
export function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

// A-t-il une présentation d'usage exploitable ?
export function tieneUso(u: { unite_uso: string | null; factor_uso: number | null }): boolean {
  return !!u.unite_uso && !!u.factor_uso && u.factor_uso > 0
}

// Quantité saisie dans une unité → unité de base (kg).
export function toBase(qty: number, unidad: 'base' | 'uso', factorUso: number | null): number {
  if (unidad === 'uso' && factorUso && factorUso > 0) return round(qty * factorUso)
  return qty
}

// Quantité de base (kg) → unité d'usage (sacs). Null si pas d'usage.
export function baseToUso(baseQty: number, factorUso: number | null): number | null {
  if (!factorUso || factorUso <= 0) return null
  return round(baseQty / factorUso)
}

// Quantité de base → { valeur, unité } à afficher : en unité d'usage si dispo,
// sinon en unité de base. Pratique pour les solicitudes (le cuisinier voit en sacs).
export function displayQty(
  baseQty: number,
  u: { unite: string; unite_uso: string | null; factor_uso: number | null }
): { value: number; unit: string } {
  if (tieneUso(u)) return { value: baseToUso(baseQty, u.factor_uso) as number, unit: u.unite_uso as string }
  return { value: round(baseQty), unit: u.unite }
}

// Libellé compact du stock : « 48 kg · ≈ 48 sac » (ou « 48 kg » si pas d'usage).
export function stockLabel(baseQty: number, u: ProductUnits): string {
  const base = `${round(baseQty)} ${u.unite}`
  if (tieneUso(u)) {
    return `${base} · ≈ ${round(baseQty / (u.factor_uso as number))} ${u.unite_uso}`
  }
  return base
}
