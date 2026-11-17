import { formatDay } from "@/lib/format";
import {
  OPENFIELD_ADDRESS,
  OPENFIELD_PHONE,
  PICKUP_LOCATION,
  type ShipRow,
  type ShipTab,
} from "@/lib/library/views";

// One printable slip; black-and-white friendly. A page break follows each.
export function PackingSlip({ row, tab }: { row: ShipRow; tab: ShipTab }) {
  return (
    <article className="slip mx-auto max-w-2xl border border-black p-8 text-black print:max-w-none print:border-0 print:p-0">
      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
        <div>
          <p className="text-xl font-bold">Openfield</p>
          <p className="text-sm">{OPENFIELD_ADDRESS}</p>
          <p className="text-sm">{OPENFIELD_PHONE}</p>
        </div>
        <div className="text-right">
          <p className="text-sm">Packing slip</p>
          <p className="text-lg font-bold tabular-nums">{row.request.id}</p>
        </div>
      </header>
      <section className="mt-5 grid grid-cols-2 gap-5">
        <div>
          <h2 className="text-sm font-bold uppercase">{tab === "ship" ? "Ship to" : "Pickup"}</h2>
          <p className="mt-1">{row.contact.name}</p>
          <p>{tab === "ship" ? row.contact.address : `At ${PICKUP_LOCATION}`}</p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase">Item</h2>
          <p className="mt-1">{row.item.name}</p>
          <p>
            Due back:{" "}
            <time dateTime={row.dueAt} className="font-bold">
              {formatDay(row.dueAt)}
            </time>
          </p>
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase">In this box</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {row.parts.map((part) => (
            <li key={part} className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-block size-4 border-2 border-black" />
              {part}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 border-t border-black pt-4">
        <h2 className="text-sm font-bold uppercase">Returning it</h2>
        <p className="mt-1">
          {tab === "ship"
            ? "Use the enclosed prepaid label. "
            : `Bring it back to the ${PICKUP_LOCATION}. `}
          Questions? Call {OPENFIELD_PHONE}.
        </p>
      </section>
    </article>
  );
}
