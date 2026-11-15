import { useRef, useState } from "react";

const CHIPS = [
  "Sharma ji ka 2500 udhaar likh do",
  "Raju ne 500 rupay diye",
  "aata 10 bag add karo",
  "cheeni 2 kg kam karo",
];

export default function CommandBox({ onText, onAudio, busy }) {
  const [text, setText] = useState("");
  const [rec, setRec] = useState(false);
  const mr = useRef(null);
  const chunks = useRef([]);

  function submit(t) {
    const v = (t ?? text).trim();
    if (!v || busy) return;
    onText(v);
    setText("");
  }

  async function toggleMic() {
    if (rec) return mr.current?.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      chunks.current = [];
      m.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      m.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRec(false);
        onAudio(new Blob(chunks.current, { type: m.mimeType || "audio/webm" }));
      };
      m.start();
      mr.current = m;
      setRec(true);
    } catch {
      alert("Mic permission allow karo (HTTPS ya localhost chahiye)");
    }
  }

  return (
    <div className="px-3 pt-2">
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => submit(c)}
            disabled={busy}
            className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Sharma ji ka 500 udhaar likh do"
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button
          onClick={toggleMic}
          disabled={busy && !rec}
          className={`h-10 w-10 rounded-full text-lg text-white ${
            rec ? "animate-pulse bg-red-600" : "bg-slate-700"
          }`}
        >
          🎤
        </button>
        <button
          onClick={() => submit()}
          disabled={busy || !text.trim()}
          className="h-10 rounded-full bg-emerald-600 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
