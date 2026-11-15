import mock from "./mockState.json";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data.ok === undefined) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

export async function getState() {
  if (USE_MOCK) return mock;
  return parse(await fetch(`${API}/api/state`));
}

export async function sendCommand(text) {
  if (USE_MOCK) return { ok: true, message: `(mock) ${text}`, state: mock };
  return parse(
    await fetch(`${API}/api/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
  );
}

export async function sendAudio(blob) {
  if (USE_MOCK) return { ok: true, message: "(mock) audio received", state: mock };
  const fd = new FormData();
  fd.append("audio", blob, "voice.webm");
  return parse(await fetch(`${API}/api/command`, { method: "POST", body: fd }));
}

export async function uploadBill(file) {
  if (USE_MOCK) return { ok: true, message: "(mock) bill added", state: mock };
  const fd = new FormData();
  fd.append("image", file);
  return parse(await fetch(`${API}/api/bill`, { method: "POST", body: fd }));
}
