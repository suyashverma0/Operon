import { useEffect, useState } from "react";
import { getState, sendCommand, sendAudio, uploadBill } from "./api";
import Ledger from "./components/Ledger";
import Stock from "./components/Stock";
import Summary from "./components/Summary";
import CommandBox from "./components/CommandBox";

const TABS = [
  { id: "ledger", label: "Ledger", icon: "📒" },
  { id: "stock", label: "Stock", icon: "📦" },
  { id: "summary", label: "Summary", icon: "📊" },
];

export default function App() {
  const [tab, setTab] = useState("ledger");
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getState().then(setState).catch((e) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function run(fn) {
    setBusy(true);
    try {
      const r = await fn();
      setToast({ ok: r.ok !== false, message: r.message || "Done" });
      if (r.state) setState(r.state);
    } catch (e) {
      setToast({ ok: false, message: e.message || "Server se connect nahi hua" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-10 bg-emerald-600 px-4 py-3 text-white shadow">
        <h1 className="text-lg font-bold">🛒 VyaparSathi</h1>
        <p className="text-xs opacity-90">Bolo ya likho, kaam ho jayega</p>
      </header>

      <main className="flex-1 px-4 pb-48 pt-4">
        {loadError && (
          <div className="mb-3 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            Data load nahi hua: {loadError}
          </div>
        )}
        {!state && !loadError && <p className="text-center text-slate-500">Loading...</p>}
        {state && tab === "ledger" && <Ledger customers={state.customers} />}
        {state && tab === "stock" && (
          <Stock items={state.items} busy={busy} onBill={(f) => run(() => uploadBill(f))} />
        )}
        {state && tab === "summary" && <Summary state={state} />}
      </main>

      {toast && (
        <div
          className={`fixed left-1/2 top-16 z-20 w-[92%] max-w-md -translate-x-1/2 rounded-xl p-3 text-sm font-medium text-white shadow-lg ${
            toast.ok ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t bg-white">
        <CommandBox
          busy={busy}
          onText={(t) => run(() => sendCommand(t))}
          onAudio={(b) => run(() => sendAudio(b))}
        />
        <nav className="grid grid-cols-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2 text-xs ${
                tab === t.id ? "font-bold text-emerald-600" : "text-slate-500"
              }`}
            >
              <div className="text-lg">{t.icon}</div>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
