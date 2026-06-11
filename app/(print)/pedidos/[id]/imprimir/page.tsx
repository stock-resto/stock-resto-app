import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/dal'
import { day } from '@/lib/format'
import { Icon } from '@/components/icon'
import { PrintButton } from '@/components/pedidos/print-button'

type LigneRow = {
  cantidad_pedida: number
  produits: { nom: string; unite: string; presentation: string | null } | null
}

type PedidoRow = {
  id: string
  numero: number
  note: string | null
  created_at: string
  fournisseur: { nom: string; contact: string | null } | null
  pedido_lineas: LigneRow[]
}

export default async function ImprimirPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getProfile()

  const [{ data }, { data: rest }] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        id, numero, note, created_at,
        fournisseur:fournisseur_id(nom, contact),
        pedido_lineas(cantidad_pedida, produits(nom, unite, presentation))
      `)
      .eq('id', id)
      .single(),
    supabase.from('restaurants').select('nom').eq('id', profile!.restaurant_id).single(),
  ])

  if (!data) notFound()
  const pedido = data as unknown as PedidoRow
  const lineas = [...pedido.pedido_lineas].sort((a, b) =>
    (a.produits?.nom ?? '').localeCompare(b.produits?.nom ?? '')
  )

  return (
    <>
      {/* Barra de acciones (no se imprime) */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3 print:hidden">
        <Link
          href={`/pedidos/${pedido.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Icon name="chevronRight" size={15} className="rotate-180" />
          Volver al pedido
        </Link>
        <PrintButton />
      </div>

      {/* Documento */}
      <div className="mx-auto max-w-[760px] px-10 py-12 text-[#1a1a1a]">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-[#1a1a1a] pb-4">
          <div>
            <div className="text-[19px] font-bold tracking-tight">{rest?.nom ?? 'Restaurante'}</div>
            <div className="mt-0.5 text-[12px] text-[#666]">Mise en Place · Inventario</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Pedido de compra</div>
            <div className="font-mono text-[18px] font-bold">PED-{pedido.numero}</div>
            <div className="text-[12px] text-[#666]">{day(pedido.created_at)}</div>
          </div>
        </div>

        {/* Proveedor */}
        <div className="mt-5 grid grid-cols-2 gap-6 border-b border-[#ddd] pb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Proveedor</div>
            <div className="mt-0.5 text-[15px] font-semibold">{pedido.fournisseur?.nom ?? 'Proveedor'}</div>
          </div>
          {pedido.fournisseur?.contact && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#888]">Contacto</div>
              <div className="mt-0.5 text-[14px] text-[#444]">{pedido.fournisseur.contact}</div>
            </div>
          )}
        </div>

        {/* Tabla (sin precios — solicitud cliente) */}
        <table className="mt-5 w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Producto</th>
              <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#888]">Presentación</th>
              <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#888]">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className="border-b border-[#eee]">
                <td className="py-2.5 font-semibold">{l.produits?.nom ?? '—'}</td>
                <td className="py-2.5 text-[#666]">{l.produits?.presentation ?? '—'}</td>
                <td className="py-2.5 text-right font-mono">
                  {Number(l.cantidad_pedida)} {l.produits?.unite ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pedido.note && (
          <div className="mt-5 rounded-md border border-[#eee] bg-[#fafafa] p-3 text-[12px]">
            <span className="font-semibold">Nota: </span>
            {pedido.note}
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-[#ddd] pt-3 text-[11px] text-[#999]">
          <span>Generado por Mise en Place · Inventario</span>
          <span>Pedido sujeto a confirmación del proveedor</span>
        </div>
      </div>
    </>
  )
}
