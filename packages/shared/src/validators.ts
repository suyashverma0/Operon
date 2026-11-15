import {
  ParsedCommandSchema,
  ParseCommandInputSchema,
  ExecuteCommandInputSchema,
} from './aiSchemas';
import { MIN_CONFIDENCE_THRESHOLD, SUPPORTED_UNITS, SupportedUnit } from './constants';
import { ParsedCommand } from './types';

export function validateParsedCommand(data: unknown): {
  success: boolean;
  data?: ParsedCommand;
  error?: string;
} {
  const result = ParsedCommandSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return { success: false, error: errorMsg };
  }

  // Business safety rule: If confidence < MIN_CONFIDENCE_THRESHOLD and action is not already needs_clarification,
  // enforce needs_clarification.
  if (
    result.data.confidence < MIN_CONFIDENCE_THRESHOLD &&
    result.data.action !== 'needs_clarification'
  ) {
    return {
      success: true,
      data: {
        action: 'needs_clarification',
        clarify: 'Command clear nahi hai, kripya thoda vistaar mein batayein.',
        confidence: result.data.confidence,
      },
    };
  }

  return { success: true, data: result.data as ParsedCommand };
}

export function validateParseCommandInput(data: unknown) {
  return ParseCommandInputSchema.safeParse(data);
}

export function validateExecuteCommandInput(data: unknown) {
  return ExecuteCommandInputSchema.safeParse(data);
}

export function isSupportedUnit(unit: string): unit is SupportedUnit {
  return (SUPPORTED_UNITS as readonly string[]).includes(unit.toLowerCase());
}

/**
 * Normalizes common Hindi/Hinglish spoken number words to numeric values.
 */
export function normalizeHindiNumber(text: string): number | null {
  const cleaned = text.trim().toLowerCase();

  const directMap: Record<string, number> = {
    ek: 1,
    do: 2,
    teen: 3,
    char: 4,
    chaar: 4,
    paanch: 5,
    panch: 5,
    chheh: 6,
    cheh: 6,
    saat: 7,
    aath: 8,
    nau: 9,
    das: 10,
    sau: 100,
    'ek sau': 100,
    'dedh sau': 150,
    'dhai sau': 250,
    hazaar: 1000,
    hazar: 1000,
    'ek hazaar': 1000,
    'ek hazar': 1000,
    'do hazaar': 2000,
    'paanch hazaar': 5000,
    'das hazaar': 10000,
    lakh: 100000,
    'ek lakh': 100000,
  };

  if (directMap[cleaned] !== undefined) {
    return directMap[cleaned];
  }

  // Handle "X sau" e.g. "paanch sau" = 500, "do sau" = 200, "char sau" = 400
  const sauMatch = cleaned.match(/^([a-z]+)\s+sau$/);
  if (sauMatch && sauMatch[1]) {
    const val = directMap[sauMatch[1]];
    if (val !== undefined) return val * 100;
  }

  // Handle "X hazaar" e.g. "teen hazaar" = 3000
  const hazarMatch = cleaned.match(/^([a-z]+)\s+haza?ar$/);
  if (hazarMatch && hazarMatch[1]) {
    const val = directMap[hazarMatch[1]];
    if (val !== undefined) return val * 1000;
  }

  // Handle standard digit match
  const digitMatch = cleaned.match(/[\d,.]+/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[0].replace(/,/g, ''));
    if (!isNaN(val)) return val;
  }

  return null;
}
