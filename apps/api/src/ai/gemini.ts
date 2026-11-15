import { ENV } from '../config/env';
import { logger } from '../utils/logger';

export interface GeminiClientInterface {
  generateText(prompt: string): Promise<string>;
}

class RealGeminiClient implements GeminiClientInterface {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data: any = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return candidateText;
  }
}

let activeGeminiClient: GeminiClientInterface = new RealGeminiClient(ENV.GEMINI_API_KEY);

export function setGeminiClient(client: GeminiClientInterface) {
  activeGeminiClient = client;
}

export function getGeminiClient(): GeminiClientInterface {
  return activeGeminiClient;
}

/**
 * Strips code fences like ```json ... ``` or ``` ... ``` from LLM text.
 */
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

/**
 * Calls Gemini with timeout and retry logic.
 */
export async function callGeminiWithRetry(
  prompt: string,
  options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxRetries = options.maxRetries ?? 2;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const generatePromise = activeGeminiClient.generateText(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);
      return cleanJsonResponse(result);
    } catch (err: any) {
      lastError = err;
      logger.warn(`Gemini call attempt ${attempt + 1} failed: ${err.message}`);
      if (attempt < maxRetries) {
        // Exponential backoff: 300ms, 600ms
        await new Promise((res) => setTimeout(res, 300 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}
