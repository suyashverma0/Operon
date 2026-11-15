export const SUPPORTED_UNITS = ['kg', 'litre', 'piece', 'packet'] as const;
export type SupportedUnit = (typeof SUPPORTED_UNITS)[number];

export const COMMAND_ACTIONS = [
  'add_udhaar',
  'record_payment',
  'add_stock',
  'remove_stock',
  'query',
  'needs_clarification',
] as const;
export type CommandAction = (typeof COMMAND_ACTIONS)[number];

export const QUERY_TYPES = [
  'balance',
  'stock',
  'sales',
  'pending_udhaar',
  'greeting',
] as const;
export type QueryType = (typeof QUERY_TYPES)[number];

export const REMOVE_STOCK_REASONS = [
  'sale',
  'wastage',
  'adjustment',
  'damaged',
  'expired',
  'personal_use',
] as const;
export type RemoveStockReason = (typeof REMOVE_STOCK_REASONS)[number];

export const DEFAULT_CURRENCY = 'INR' as const;
export const MIN_CONFIDENCE_THRESHOLD = 0.7;
