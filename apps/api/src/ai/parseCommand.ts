import {
  ParseContext,
  ParseOutcome,
  ResolvedEntities,
  Logger,
} from './types';
import {
  CommandSchema,
  ExecutableCommand,
} from './schemas';
import { LlmClient, GeminiError, cleanJsonResponse } from './gemini';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { resolveEntity } from './validators';
import { extractNumberMentions, scanUnits } from './numbers';
import { resolveRelativeDate, DEFAULT_TIMEZONE } from './dates';

export const MAX_COMMAND_LENGTH = 500;
export type ParseDeps = ParseCommandDeps;

export const consoleLogger: Logger = {
  info: (f, m) => console.log(m, f),
  warn: (f, m) => console.warn(m, f),
  error: (f, m) => console.error(m, f),
};

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /show\s+me\s+your\s+system\s+prompt/i,
  /print\s+the\s+api\s+key/i,
  /pichle\s+instructions\s+ko\s+ignore/i,
  /<\/user_command>/i,
  /you\s+are\s+now\s+admin/i,
];

const GREETING_PATTERN = /^(namaste|namaskar|hello|hi|pranam|ram\s*ram)(\s+openron)?[\s.!]*$/i;

export interface ParseCommandDeps {
  client: LlmClient;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  maxAttempts?: number;
  logger?: Logger;
}

export async function parseCommand(
  rawInput: unknown,
  context: ParseContext = {},
  deps: ParseCommandDeps
): Promise<ParseOutcome> {
  const {
    client,
    sleep = async () => {},
    timeoutMs = 15000,
    maxAttempts = 3,
    logger,
  } = deps;

  // 1. Validate input shape
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      status: 'clarification',
      clarify: 'Kripya koi command likhein ya bolein.',
      reason: 'empty_input',
    };
  }

  const text = rawInput.trim();

  if (text.length > MAX_COMMAND_LENGTH) {
    return {
      status: 'clarification',
      clarify: 'Command bahut lambi hai. Kripya chhota sandesh dein.',
      reason: 'input_too_long',
    };
  }

  // 2. Prompt injection guard
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'clarification',
        clarify: 'Aapka command aspasht hai. Kripya vyapar sambandhi command dein.',
        reason: 'unsafe_input',
      };
    }
  }

  // 3. Fast deterministic check for pure greetings (0 AI calls)
  if (GREETING_PATTERN.test(text)) {
    return {
      status: 'ready',
      command: {
        action: 'query',
        queryType: 'greeting',
        confidence: 0.99,
      },
      resolved: {},
      requiresConfirmation: false,
      source: 'deterministic',
    };
  }

  // 4. Construct user prompt
  const userPrompt = buildUserPrompt(text, context);
  const req = { systemPrompt: SYSTEM_PROMPT, userPrompt };

  let rawLlmOutput = '';
  let parsedCommandData: any = null;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const timerPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new GeminiError('Request timed out', true)), timeoutMs)
      );

      const responseText = await Promise.race([client.generate(req), timerPromise]);
      const cleaned = cleanJsonResponse(responseText);
      const json = JSON.parse(cleaned);
      const validation = CommandSchema.safeParse(json);

      if (validation.success) {
        parsedCommandData = validation.data;
        break;
      } else {
        lastError = new Error('Schema validation failed: ' + validation.error.message);
      }
    } catch (err: any) {
      lastError = err;
      if (err instanceof GeminiError && !err.retryable) {
        // Non-retryable error: fail immediately without burning more attempts
        break;
      }
    }

    if (attempt < maxAttempts - 1) {
      await sleep(50 * Math.pow(2, attempt));
    }
  }

  if (!parsedCommandData) {
    if (lastError instanceof GeminiError) {
      return {
        status: 'clarification',
        clarify: 'AI service se sampark nahi ho pa raha hai. Kripya thodi der baad koshish karein.',
        reason: 'ai_unavailable',
      };
    }

    if (lastError?.name === 'SyntaxError' || lastError?.message?.includes('Schema validation')) {
      return {
        status: 'clarification',
        clarify: 'Command samajh nahi aayi, kripya spasht shabdon mein batayein.',
        reason: 'invalid_ai_output',
      };
    }

    return {
      status: 'clarification',
      clarify: 'AI service uplabdh nahi hai. Kripya baad mein prayas karein.',
      reason: 'ai_unavailable',
    };
  }

  const cmd = parsedCommandData;

  // 5. Handle model-requested clarification
  if (cmd.action === 'needs_clarification') {
    return {
      status: 'clarification',
      clarify: cmd.clarify,
      reason: 'model_requested',
    };
  }

  // 6. Confidence threshold check (strictly < 0.70)
  if (cmd.confidence < 0.7) {
    return {
      status: 'clarification',
      clarify: 'Command puri tarah spasht nahi hai. Kripya thoda vistaar mein batayein.',
      reason: 'low_confidence',
    };
  }

  // 7. Value and cross-check validations
  const mentions = extractNumberMentions(text);

  // A. Financial amount checks
  if (cmd.action === 'add_udhaar' || cmd.action === 'record_payment') {
    if (cmd.amount > 10_000_000) {
      return {
        status: 'clarification',
        clarify: `Rashi ₹${cmd.amount} bahut adhik hai. Kripya sahi rashi batayein.`,
        reason: 'value_out_of_range',
      };
    }

    const amountMentions = mentions.filter((m) => m.kind === 'amount');
    if (amountMentions.length > 0 && !amountMentions.some((m) => m.value === cmd.amount)) {
      return {
        status: 'clarification',
        clarify: 'Command mein likhi rashi samajh nahi aayi.',
        reason: 'amount_mismatch',
      };
    }
  }

  // B. Inventory quantity & unit checks
  if (cmd.action === 'add_stock' || cmd.action === 'remove_stock') {
    const qtyMentions = mentions.filter((m) => m.kind === 'quantity');
    if (qtyMentions.length > 0 && !qtyMentions.some((m) => m.value === cmd.quantity)) {
      return {
        status: 'clarification',
        clarify: 'Quantity mismatch.',
        reason: 'quantity_mismatch',
      };
    }

    const unitScan = scanUnits(text);
    if (unitScan.unsupported) {
      return {
        status: 'clarification',
        clarify: 'Yeh unit samarthit nahi hai. Kripya kg, litre, piece ya packet ka upyog karein.',
        reason: 'unit_mismatch',
      };
    }
    if (unitScan.supported.size > 0 && !unitScan.supported.has(cmd.unit)) {
      return {
        status: 'clarification',
        clarify: 'Unit mismatch.',
        reason: 'unit_mismatch',
      };
    }
  }

  const resolved: ResolvedEntities = {};

  // 8. Customer entity resolution
  if (cmd.action === 'query' && cmd.queryType === 'balance' && !cmd.customerName) {
    return {
      status: 'clarification',
      clarify: 'Kis grahak ka balance dekhna hai?',
      reason: 'missing_entity',
    };
  }

  if (cmd.customerName) {
    const custRes = resolveEntity(cmd.customerName, context.customers || []);
    if (custRes.status === 'not_found') {
      return {
        status: 'clarification',
        clarify: `Grahak "${cmd.customerName}" list mein nahi mila.`,
        reason: 'customer_not_found',
      };
    }
    if (custRes.status === 'ambiguous') {
      const candidateNames = custRes.candidates.map((c) => c.name).join(' ya ');
      return {
        status: 'clarification',
        clarify: `Aap kis grahak ki baat kar rahe hain? ${candidateNames}?`,
        reason: 'customer_ambiguous',
      };
    }
    resolved.customerId = custRes.entity.id;
    resolved.customerName = custRes.entity.name;
  }

  // 9. Product entity resolution
  if (cmd.productName) {
    const prodRes = resolveEntity(cmd.productName, context.products || []);
    if (prodRes.status === 'not_found') {
      return {
        status: 'clarification',
        clarify: `Product "${cmd.productName}" stock mein nahi mila.`,
        reason: 'product_not_found',
      };
    }
    if (prodRes.status === 'ambiguous') {
      const candidateNames = prodRes.candidates.map((p) => p.name).join(' ya ');
      return {
        status: 'clarification',
        clarify: `Aap kis product ki baat kar rahe hain? ${candidateNames}?`,
        reason: 'product_ambiguous',
      };
    }
    resolved.productId = prodRes.entity.id;
    resolved.productName = prodRes.entity.name;

    // Unit verification for stock mutation
    if (cmd.action === 'add_stock' || cmd.action === 'remove_stock') {
      const unitScan = scanUnits(text);
      if (unitScan.supported.size === 0) {
        if (prodRes.entity.unit) {
          cmd.unit = prodRes.entity.unit;
        } else {
          return {
            status: 'clarification',
            clarify: `Product "${prodRes.entity.name}" ki unit batayein (kg, litre, piece, packet).`,
            reason: 'unit_missing',
          };
        }
      }
    }
  }

  // 10. Date resolution
  if (cmd.relativeDate) {
    const ref = context.referenceDate ? new Date(context.referenceDate) : new Date();
    const tz = context.timezone || DEFAULT_TIMEZONE;
    resolved.dateRange = resolveRelativeDate(cmd.relativeDate, ref, tz);
  }

  const requiresConfirmation = cmd.action !== 'query';

  if (logger) {
    logger.info(
      {
        status: 'ready',
        action: cmd.action,
        requestId: context.requestId,
      },
      'Command successfully parsed and resolved'
    );
  }

  return {
    status: 'ready',
    command: cmd as ExecutableCommand,
    resolved,
    requiresConfirmation,
    source: 'ai',
  };
}
