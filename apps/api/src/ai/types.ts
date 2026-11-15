import type { ExecutableCommand, Unit } from './schemas';
import type { DateRange } from './dates';

export interface CustomerCandidate {
  id: string;
  name: string;
}

export interface ProductCandidate {
  id: string;
  name: string;
  /** The product's configured unit, if the store has one. */
  unit?: Unit;
}

/** Everything here must already be scoped to the authenticated store/tenant by the backend. */
export interface ParseContext {
  /** ISO-8601 instant used as "now" for relative dates. Defaults to the current time. */
  referenceDate?: string;
  /** IANA timezone, e.g. Asia/Kolkata (default). */
  timezone?: string;
  customers?: CustomerCandidate[];
  products?: ProductCandidate[];
  /** Correlation id for logs only. */
  requestId?: string;
}

export type ClarificationReason =
  | 'empty_input'
  | 'input_too_long'
  | 'unsafe_input'
  | 'ai_unavailable'
  | 'invalid_ai_output'
  | 'low_confidence'
  | 'model_requested'
  | 'missing_entity'
  | 'customer_not_found'
  | 'customer_ambiguous'
  | 'product_not_found'
  | 'product_ambiguous'
  | 'amount_mismatch'
  | 'quantity_mismatch'
  | 'unit_missing'
  | 'unit_mismatch'
  | 'value_out_of_range';

export interface ResolvedEntities {
  customerId?: string;
  customerName?: string;
  productId?: string;
  productName?: string;
  dateRange?: DateRange;
}

export type ParseOutcome =
  | {
      status: 'ready';
      command: ExecutableCommand;
      resolved: ResolvedEntities;
      /** True for every state-changing action; the UI should show a confirm step. */
      requiresConfirmation: boolean;
      source: 'ai' | 'deterministic';
    }
  | {
      status: 'clarification';
      clarify: string;
      reason: ClarificationReason;
    };

export interface Logger {
  info(fields: Record<string, unknown>, msg: string): void;
  warn(fields: Record<string, unknown>, msg: string): void;
  error(fields: Record<string, unknown>, msg: string): void;
}
