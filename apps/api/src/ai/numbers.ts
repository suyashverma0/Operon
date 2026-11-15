import type { Unit } from './schemas';

/**
 * Deterministic cross-check helpers. They never *decide* an action; they only
 * let the backend notice when the model's numbers disagree with the text.
 */

const WORD_VALUES: Record<string, number> = {
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, paach: 5,
  chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10, bees: 20, tees: 30,
  chalis: 40, pachas: 50, saath: 60, sattar: 70, assi: 80, nabbe: 90,
  dhai: 2.5, dhaai: 2.5, dedh: 1.5, aadha: 0.5, adha: 0.5,
};

const MULTIPLIERS: Record<string, number> = {
  sau: 100, hazaar: 1000, hazar: 1000, hajar: 1000, hajaar: 1000, lakh: 100_000, lac: 100_000,
};

const UNIT_ALIASES: Record<string, Unit> = {
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg', 'किलो': 'kg',
  litre: 'litre', litres: 'litre', liter: 'litre', liters: 'litre', ltr: 'litre', ltrs: 'litre', 'लीटर': 'litre',
  piece: 'piece', pieces: 'piece', pcs: 'piece', pc: 'piece', 'नग': 'piece',
  packet: 'packet', packets: 'packet', pkt: 'packet', pkts: 'packet', 'पैकेट': 'packet',
};

/** Units the system does not support; seeing one means we must not guess. */
const UNSUPPORTED_UNITS = new Set([
  'gram', 'grams', 'gm', 'gms', 'dozen', 'darjan', 'ml', 'quintal', 'bori', 'box', 'peti', 'bottle', 'bottles',
]);

export function normalizeUnit(raw: string): Unit | undefined {
  return UNIT_ALIASES[raw.trim().toLowerCase()];
}

function tokenize(text: string): string[] {
  const ascii = text
    .toLowerCase()
    .replace(/[\u0966-\u096F]/g, (c) => String(c.charCodeAt(0) - 0x0966)) // Devanagari digits
    .replace(/(\d),(?=\d)/g, '$1'); // 1,500 -> 1500
  return ascii
    .split(/[^\p{L}\p{M}\p{N}.]+/u)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean);
}

const isDigits = (t: string) => /^\d+(\.\d+)?$/.test(t);

export interface NumberMention {
  value: number;
  kind: 'amount' | 'quantity';
  unit?: Unit;
}

export function extractNumberMentions(text: string): NumberMention[] {
  const tokens = tokenize(text);
  const out: NumberMention[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const base = isDigits(t) ? Number(t) : WORD_VALUES[t];
    if (base !== undefined) {
      const next = tokens[i + 1];
      const mult = next !== undefined ? MULTIPLIERS[next] : undefined;
      if (mult !== undefined) {
        out.push({ value: base * mult, kind: 'amount' });
        i++;
        continue;
      }
      const unit = next !== undefined ? UNIT_ALIASES[next] : undefined;
      if (unit) {
        out.push({ value: base, kind: 'quantity', unit });
        i++;
        continue;
      }
      if (next !== undefined && UNSUPPORTED_UNITS.has(next)) {
        i++; // a number attached to an unsupported unit is neither amount nor supported quantity
        continue;
      }
      if (isDigits(t)) out.push({ value: base, kind: 'amount' });
      continue;
    }
    const standalone = MULTIPLIERS[t]; // "sau rupaye", "hazaar"
    if (standalone !== undefined) out.push({ value: standalone, kind: 'amount' });
  }
  return out;
}

export interface UnitScan {
  supported: Set<Unit>;
  unsupported: boolean;
}

export function scanUnits(text: string): UnitScan {
  const supported = new Set<Unit>();
  let unsupported = false;
  for (const t of tokenize(text)) {
    const u = UNIT_ALIASES[t];
    if (u) supported.add(u);
    else if (UNSUPPORTED_UNITS.has(t)) unsupported = true;
  }
  return { supported, unsupported };
}

export const sameNumber = (a: number, b: number) => Math.abs(a - b) < 1e-9;
