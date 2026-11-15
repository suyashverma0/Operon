import { z } from 'zod';
import {
  COMMAND_ACTIONS,
  DEFAULT_CURRENCY,
  QUERY_TYPES,
  SUPPORTED_UNITS,
} from './constants';

export const SupportedUnitEnum = z.enum(SUPPORTED_UNITS);
export const CommandActionEnum = z.enum(COMMAND_ACTIONS);
export const QueryTypeEnum = z.enum(QUERY_TYPES);

export const AddUdhaarSchema = z.object({
  action: z.literal('add_udhaar'),
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .min(1, 'Customer name cannot be empty')
    .trim(),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive and greater than 0')
    .finite(),
  currency: z.literal(DEFAULT_CURRENCY).default(DEFAULT_CURRENCY),
  confidence: z.number().min(0).max(1),
  relativeDate: z.string().optional(),
  notes: z.string().optional(),
});

export const RecordPaymentSchema = z.object({
  action: z.literal('record_payment'),
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .min(1, 'Customer name cannot be empty')
    .trim(),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive and greater than 0')
    .finite(),
  currency: z.literal(DEFAULT_CURRENCY).default(DEFAULT_CURRENCY),
  confidence: z.number().min(0).max(1),
  relativeDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const AddStockSchema = z.object({
  action: z.literal('add_stock'),
  productName: z
    .string({ required_error: 'Product name is required' })
    .min(1, 'Product name cannot be empty')
    .trim(),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be positive and greater than 0')
    .finite(),
  unit: SupportedUnitEnum,
  confidence: z.number().min(0).max(1),
  costPrice: z.number().positive().optional(),
  relativeDate: z.string().optional(),
});

export const RemoveStockSchema = z.object({
  action: z.literal('remove_stock'),
  productName: z
    .string({ required_error: 'Product name is required' })
    .min(1, 'Product name cannot be empty')
    .trim(),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be positive and greater than 0')
    .finite(),
  unit: SupportedUnitEnum,
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1),
  relativeDate: z.string().optional(),
});

export const QuerySchema = z.object({
  action: z.literal('query'),
  queryType: QueryTypeEnum,
  customerName: z.string().min(1).trim().optional(),
  productName: z.string().min(1).trim().optional(),
  period: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const NeedsClarificationSchema = z.object({
  action: z.literal('needs_clarification'),
  clarify: z
    .string({ required_error: 'Clarification question is required' })
    .min(1, 'Clarification question cannot be empty'),
  confidence: z.number().min(0).max(1),
});

export const ParsedCommandSchema = z.discriminatedUnion('action', [
  AddUdhaarSchema,
  RecordPaymentSchema,
  AddStockSchema,
  RemoveStockSchema,
  QuerySchema,
  NeedsClarificationSchema,
]);

export const ParseCommandInputSchema = z.object({
  command: z
    .string({ required_error: 'Command text is required' })
    .min(1, 'Command text cannot be empty')
    .max(1000, 'Command text too long')
    .trim(),
  context: z
    .object({
      storeId: z.string().optional(),
      storeName: z.string().optional(),
      referenceDate: z.string().optional(),
      timezone: z.string().optional(),
      customerCandidates: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            phone: z.string().nullable().optional(),
            aliases: z.array(z.string()).optional(),
            currentBalance: z.number().optional(),
          })
        )
        .optional(),
      productCandidates: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            unit: z.string(),
            currentStock: z.number().optional(),
            price: z.number().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const ExecuteCommandInputSchema = z.object({
  parsedCommand: ParsedCommandSchema,
  confirmed: z.boolean().default(false),
});
