import { GeminiError, type LlmClient, type LlmRequest } from '../src/ai/gemini';
import type { ParseContext } from '../src/ai/types';

type Step = string | object | Error | ((req: LlmRequest) => Promise<string>);

export function mockClient(...steps: Step[]): LlmClient & { calls: LlmRequest[] } {
  const calls: LlmRequest[] = [];
  return {
    calls,
    async generate(req) {
      calls.push(req);
      const step = steps[Math.min(calls.length - 1, steps.length - 1)];
      if (step instanceof Error) throw step;
      if (typeof step === 'function') return step(req);
      return typeof step === 'string' ? step : JSON.stringify(step);
    },
  };
}

export const noSleep = async () => {};
export const retryable = (status = 503) => new GeminiError(`Gemini HTTP ${status}`, true, status);

export const ctx: ParseContext = {
  referenceDate: '2026-11-15T06:00:00Z',
  timezone: 'Asia/Kolkata',
  customers: [
    { id: 'c1', name: 'Ramesh' },
    { id: 'c2', name: 'Suresh Sharma' },
    { id: 'c3', name: 'Mohan Verma' },
    { id: 'c4', name: 'Mohan Gupta' },
  ],
  products: [
    { id: 'p1', name: 'Aata', unit: 'kg' },
    { id: 'p2', name: 'Chawal', unit: 'kg' },
    { id: 'p3', name: 'Doodh', unit: 'litre' },
    { id: 'p4', name: 'Biscuit' },
  ],
  requestId: 'req-test',
};

export const deps = (client: LlmClient, extra = {}) => ({ client, sleep: noSleep, ...extra });
