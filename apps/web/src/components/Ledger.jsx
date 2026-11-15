import { inr } from "../lib";

export default function Ledger({ customers }) {
  const sorted = [...customers].sort((a, b) => b.balance - a.balance);
  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-slate-700">Udhaar Khata</h2>
      {sorted.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
              {c.name[0]}
            </div>
            <span className="font-medium">{c.name}</span>
          </div>
          <span
            className={`font-bold ${
              c.balance > 3000 ? "text-red-600" : c.balance === 0 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {c.balance === 0 ? "Clear ✓" : inr(c.balance)}
          </span>
        </div>
      ))}
    </div>
  );
}
