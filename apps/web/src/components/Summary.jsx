import { inr } from "../lib";

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

export default function Summary({ state }) {
  const { summary, items } = state;
  const low = items.filter((i) => i.low);
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-700">Aaj ka Summary</h2>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total udhaar" value={inr(summary.totalUdhaar)} color="text-red-600" />
        <Stat label="Aaj mila" value={inr(summary.paymentsToday)} color="text-emerald-600" />
        <Stat label="Low stock" value={summary.lowStockCount} color="text-amber-600" />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Jaldi mangwao 🛍️</h3>
        {low.length === 0 && <p className="text-sm text-slate-500">Sab stock theek hai ✓</p>}
        {low.map((i) => (
          <div key={i.id} className="mb-1 flex justify-between rounded-lg bg-amber-50 p-2 text-sm">
            <span>{i.name}</span>
            <span className="font-medium">{i.stock} / {i.threshold} {i.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
