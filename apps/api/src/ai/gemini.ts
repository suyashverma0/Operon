export interface LlmRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface LlmClient {
  generate(req: LlmRequest): Promise<string>;
}

export class GeminiError extends Error {
  public retryable: boolean;
  public status?: number;

  constructor(message: string, retryable: boolean, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.retryable = retryable;
    this.status = status;
  }
}

export interface CreateGeminiClientOptions {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}

export function createGeminiClient(options: CreateGeminiClientOptions): LlmClient {
  const { apiKey, model = 'gemini-2.5-flash', fetchImpl = fetch } = options;

  return {
    async generate(req: LlmRequest): Promise<string> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: req.systemPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: req.userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0,
              responseMimeType: 'application/json',
            },
          }),
        });
      } catch (err: any) {
        // Network failure or AbortError are retryable
        throw new GeminiError('Gemini network request failed', true);
      }

      if (!response.ok) {
        const isRetryable =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 503 ||
          response.status >= 500;

        // Never leak secrets or raw error body in the message
        throw new GeminiError(`Gemini HTTP ${response.status}`, isRetryable, response.status);
      }

      const data: any = await response.json();

      if (data?.promptFeedback?.blockReason) {
        throw new GeminiError(
          `Gemini generation blocked: ${data.promptFeedback.blockReason}`,
          false
        );
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || typeof text !== 'string') {
        throw new GeminiError('Empty response from Gemini', false);
      }

      return text;
    },
  };
}

export function createGeminiClientFromEnv(
  env: Record<string, string | undefined> = process.env
): LlmClient {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return createGeminiClient({ apiKey });
}

// Helpers for backward compatibility or simple use cases
let defaultClient: LlmClient | null = null;

export function getGeminiClient(): LlmClient {
  if (!defaultClient) {
    defaultClient = createGeminiClientFromEnv();
  }
  return defaultClient;
}

export function setGeminiClient(client: LlmClient) {
  defaultClient = client;
}

export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}
