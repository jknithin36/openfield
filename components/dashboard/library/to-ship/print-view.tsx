"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { LibraryData } from "@/lib/types";
import { parseOne, SHIP_TABS, toShipView } from "@/lib/library/views";
import { useLibrary } from "@/components/dashboard/shared/use-library";
import { PackingSlip } from "@/components/dashboard/library/to-ship/packing-slip";

export function PrintView() {
  const data = useLibrary();
  return data ? <Slips data={data} /> : <p className="p-8">Loading…</p>;
}

function Slips({ data }: { data: LibraryData }) {
  const [now] = useState(() => new Date());
  const params = useSearchParams();
  const tab = parseOne(params.get("tab"), SHIP_TABS, "ship");
  const idsParam = params.get("ids");

  const rows = useMemo(() => {
    const ids = idsParam?.split(",").filter(Boolean);
    const all = toShipView(data, tab, now).rows;
    return ids?.length ? all.filter((r) => ids.includes(r.request.id)) : all;
  }, [data, tab, now, idsParam]);

  // Open the print dialog once the slips are on screen ("Print" is the fallback).
  useEffect(() => {
    if (!rows.length) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [rows.length]);

  return (
    <main className="bg-white p-6 text-black print:p-0">
      <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold">Packing slips ({rows.length})</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <Link href={`/dashboard/library/to-ship${tab === "pickup" ? "?tab=pickup" : ""}`} />
            }
            className="h-11 px-4 focus-visible:ring-3 focus-visible:ring-ring"
          >
            Back to To ship
          </Button>
          <Button
            onClick={() => window.print()}
            className="h-11 bg-brand px-4 text-white hover:bg-brand-hover focus-visible:ring-3 focus-visible:ring-ring"
          >
            Print
          </Button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mx-auto max-w-2xl">Nothing to print.</p>
      ) : (
        <div className="flex flex-col gap-8 print:gap-0">
          {rows.map((row) => (
            <PackingSlip key={row.request.id} row={row} tab={tab} />
          ))}
        </div>
      )}
    </main>
  );
}
