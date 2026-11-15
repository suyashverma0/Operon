export default function Stock({ items, onBill, busy }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">Stock</h2>
        <label
          className={`cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white ${
            busy ? "opacity-50" : ""
          }`}
        >
          📷 Scan bill
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onBill(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          className={`flex items-center justify-between rounded-xl p-3 shadow-sm ${
            it.low ? "border border-red-200 bg-red-50" : "bg-white"
          }`}
        >
          <div>
            <div className="font-medium">{it.name}</div>
            <div className="text-xs text-slate-500">Min: {it.threshold} {it.unit}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">{it.stock} {it.unit}</div>
            {it.low && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                LOW
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
