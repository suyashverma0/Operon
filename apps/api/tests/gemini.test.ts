import { describe, expect, it } from 'vitest';
import { GeminiError, createGeminiClient, createGeminiClientFromEnv } from '../src/ai/gemini';

const okBody = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });
const fakeFetch = (status: number, body: unknown, spy?: (url: string, init: RequestInit) => void): typeof fetch =>
  (async (url: string, init: RequestInit) => {
    spy?.(url, init);
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;

const make = (f: typeof fetch) => createGeminiClient({ apiKey: 'SECRET-KEY', model: 'm1', fetchImpl: f });
const req = { systemPrompt: 's', userPrompt: 'u' };

describe('createGeminiClient', () => {
  it('sends key in a header (not the URL), temperature 0 and JSON mime type', async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const out = await make(fakeFetch(200, okBody('{"a":1}'), (url, init) => (seen = { url, init }))).generate(req);
    expect(out).toBe('{"a":1}');
    expect(seen!.url).toContain('/models/m1:generateContent');
    expect(seen!.url).not.toContain('SECRET-KEY');
    expect((seen!.init.headers as Record<string, string>)['x-goog-api-key']).toBe('SECRET-KEY');
    const body = JSON.parse(seen!.init.body as string);
    expect(body.generationConfig).toMatchObject({ temperature: 0, responseMimeType: 'application/json' });
  });

  it.each([[429, true], [500, true], [503, true], [400, false], [401, false], [403, false]])(
    'HTTP %d retryable=%s',
    async (status, retryable) => {
      const err = await make(fakeFetch(status, { error: { message: 'leak SECRET-KEY?' } })).generate(req).catch((e) => e);
      expect(err).toBeInstanceOf(GeminiError);
      expect(err.retryable).toBe(retryable);
      expect(err.message).not.toContain('SECRET-KEY');
      expect(err.message).not.toContain('leak');
    },
  );

  it('network failure and abort are retryable', async () => {
    const boom = (async () => { throw new TypeError('fetch failed'); }) as unknown as typeof fetch;
    expect(await make(boom).generate(req).catch((e) => e)).toMatchObject({ retryable: true });
    const abort = (async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); }) as unknown as typeof fetch;
    expect(await make(abort).generate(req).catch((e) => e)).toMatchObject({ retryable: true });
  });

  it('empty / blocked responses fail without retry', async () => {
    const err = await make(fakeFetch(200, { promptFeedback: { blockReason: 'SAFETY' } })).generate(req).catch((e) => e);
    expect(err).toMatchObject({ retryable: false });
  });

  it('env factory requires GEMINI_API_KEY', () => {
    expect(() => createGeminiClientFromEnv({})).toThrow('GEMINI_API_KEY');
    expect(() => createGeminiClientFromEnv({ GEMINI_API_KEY: 'k' })).not.toThrow();
  });
});
