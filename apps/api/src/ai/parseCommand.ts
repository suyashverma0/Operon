import {
  CommandContext,
  ParsedCommand,
  validateParsedCommand,
} from '@openron/shared';
import { buildPromptWithContext } from './prompts';
import { callGeminiWithRetry } from './gemini';
import { logger } from '../utils/logger';

// Prompt injection or jailbreak patterns to neutralize
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+a/i,
  /system\s+prompt/i,
  /drop\s+database/i,
  /delete\s+from/i,
  /execute\s+script/i,
];

// Simple greetings that can be fast-tracked or prioritized
const GREETING_PATTERNS = [
  /^(namaste|namaskar|hello|hi|pranam|ram\s*ram)(\s+openron)?[\s.!]*$/i,
];

export async function parseCommand(
  rawCommand: string,
  context?: CommandContext
): Promise<ParsedCommand> {
  const command = rawCommand?.trim() || '';

  if (!command) {
    return {
      action: 'needs_clarification',
      clarify: 'Kripya koi command likhein ya bolein.',
      confidence: 0,
    };
  }

  // 1. Guard against prompt injection or malicious text
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(command)) {
      logger.warn(`Potential malicious or prompt injection input detected: "${command}"`);
      return {
        action: 'needs_clarification',
        clarify: 'Aapka command samajh nahi aaya. Kripya dukan se sambandhit command dein.',
        confidence: 0.1,
      };
    }
  }

  // 2. Deterministic fast check for pure greetings
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(command)) {
      return {
        action: 'query',
        queryType: 'greeting',
        confidence: 0.99,
      };
    }
  }

  // 3. Negative amount check
  if (/-\s*\d+/.test(command) || /negative\s+\d+/i.test(command)) {
    return {
      action: 'needs_clarification',
      clarify: 'Negative amount ya quantity allow nahi hai. Kripya positive sankhya batayein.',
      confidence: 0.3,
    };
  }

  // 4. Candidate disambiguation helper if candidates are supplied
  const resolveCustomerAmbiguity = (customerName: string): string | null => {
    if (!context?.customerCandidates || context.customerCandidates.length === 0) {
      return null;
    }
    const lower = customerName.toLowerCase().trim();
    const matching = context.customerCandidates.filter(
      (c) =>
        c.name.toLowerCase() === lower ||
        c.name.toLowerCase().includes(lower) ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase() === lower))
    );

    if (matching.length > 1) {
      const names = matching.map((m) => m.name).join(' ya ');
      return `Aap kis ${customerName} ki baat kar rahe hain? ${names}?`;
    }
    return null;
  };

  // 5. Construct LLM prompt
  const fullPrompt = buildPromptWithContext(command, context);

  let rawLlmOutput = '';
  try {
    rawLlmOutput = await callGeminiWithRetry(fullPrompt, {
      timeoutMs: 12000,
      maxRetries: 2,
    });
  } catch (err: any) {
    logger.error('Gemini API call failed after retries:', err);
    return {
      action: 'needs_clarification',
      clarify: 'AI service se connect karne mein samasya aayi. Kripya dubara koshish karein.',
      confidence: 0.2,
    };
  }

  // 6. JSON parsing with safe error recovery
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawLlmOutput);
  } catch (err) {
    logger.warn(`Failed to parse LLM response as JSON: "${rawLlmOutput}"`);
    return {
      action: 'needs_clarification',
      clarify: 'Command samajh nahi aayi, kripya spasht shabdon mein batayein.',
      confidence: 0.3,
    };
  }

  // 7. Zod Schema Validation
  const validationResult = validateParsedCommand(parsedJson);
  if (!validationResult.success || !validationResult.data) {
    logger.warn(`Zod validation failed for output: ${validationResult.error}`);
    return {
      action: 'needs_clarification',
      clarify: 'Command adhoori ya aspasht hai. Kripya sahi jankari ke saath batayein.',
      confidence: 0.4,
    };
  }

  const result = validationResult.data;

  // 8. Context Candidate Ambiguity Check
  if (
    (result.action === 'add_udhaar' ||
      result.action === 'record_payment' ||
      (result.action === 'query' && result.customerName)) &&
    result.customerName
  ) {
    const clarification = resolveCustomerAmbiguity(result.customerName);
    if (clarification) {
      return {
        action: 'needs_clarification',
        clarify: clarification,
        confidence: 0.5,
      };
    }
  }

  return result;
}
