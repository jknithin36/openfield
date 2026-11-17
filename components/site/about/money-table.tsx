/** A plain table with a caption and row headers. Every value is text. */
export function DataTableSimple({
  caption,
  head,
  rows,
  foot,
}: {
  caption: string;
  head: string[];
  rows: Array<[string, ...React.ReactNode[]]>;
  foot?: [string, ...React.ReactNode[]];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-3xl border-collapse text-left text-base">
        <caption className="mb-2 text-left text-[15px] font-semibold text-ink">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-ink">
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`py-2 pr-4 font-semibold ${i > 0 ? "text-right" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, ...cells]) => (
            <tr key={label} className="border-b border-border">
              <th scope="row" className="py-2.5 pr-4 font-normal">
                {label}
              </th>
              {cells.map((c, i) => (
                <td key={i} className="py-2.5 pr-4 text-right tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr className="border-t-2 border-ink">
              <th scope="row" className="py-2.5 pr-4 font-semibold">
                {foot[0]}
              </th>
              {foot.slice(1).map((c, i) => (
                <td key={i} className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
