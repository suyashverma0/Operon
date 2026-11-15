import { CommandAction, QueryType, SupportedUnit } from './constants';

export interface CustomerCandidate {
  id: string;
  name: string;
  phone?: string | null;
  aliases?: string[];
  currentBalance?: number;
}

export interface ProductCandidate {
  id: string;
  name: string;
  unit: SupportedUnit | string;
  currentStock?: number;
  price?: number;
}

export interface CommandContext {
  storeId: string;
  storeName?: string;
  referenceDate?: string; // ISO date string or YYYY-MM-DD
  timezone?: string; // e.g. "Asia/Kolkata"
  customerCandidates?: CustomerCandidate[];
  productCandidates?: ProductCandidate[];
}

export interface ParseCommandInput {
  command: string;
  context?: CommandContext;
}

// Discriminated union types for parsed commands
export interface AddUdhaarCommand {
  action: 'add_udhaar';
  customerName: string;
  amount: number;
  currency: 'INR';
  confidence: number;
  relativeDate?: string;
  notes?: string;
}

export interface RecordPaymentCommand {
  action: 'record_payment';
  customerName: string;
  amount: number;
  currency: 'INR';
  confidence: number;
  relativeDate?: string;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'bank_transfer' | string;
  notes?: string;
}

export interface AddStockCommand {
  action: 'add_stock';
  productName: string;
  quantity: number;
  unit: SupportedUnit;
  confidence: number;
  costPrice?: number;
  relativeDate?: string;
}

export interface RemoveStockCommand {
  action: 'remove_stock';
  productName: string;
  quantity: number;
  unit: SupportedUnit;
  reason?: string;
  confidence: number;
  relativeDate?: string;
}

export interface QueryCommand {
  action: 'query';
  queryType: QueryType;
  customerName?: string;
  productName?: string;
  period?: string;
  confidence: number;
}

export interface NeedsClarificationCommand {
  action: 'needs_clarification';
  clarify: string;
  confidence: number;
}

export type ParsedCommand =
  | AddUdhaarCommand
  | RecordPaymentCommand
  | AddStockCommand
  | RemoveStockCommand
  | QueryCommand
  | NeedsClarificationCommand;

export interface CommandExecutionResult {
  success: boolean;
  action: CommandAction;
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  confirmationPayload?: any;
  clarify?: string;
}
