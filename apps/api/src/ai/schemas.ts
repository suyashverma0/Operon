import { z } from 'zod';

export const UNITS = ['kg', 'litre', 'piece', 'packet'] as const;
export type Unit = (typeof UNITS)[number];
export const UnitSchema = z.enum(UNITS);

export const RELATIVE_DATES = [
  'today',
  'yesterday',
  'day_before_yesterday',
  'last_week',
  'last_month',
] as const;
export type RelativeDate = (typeof RELATIVE_DATES)[number];
export const RelativeDateSchema = z.enum(RELATIVE_DATES);

export const QUERY_TYPES = [
  'balance',
  'stock',
  'sales',
  'pending_udhaar',
  'greeting',
] as const;
export type QueryType = (typeof QUERY_TYPES)[number];
export const QueryTypeSchema = z.enum(QUERY_TYPES);

const nullableOptionalString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v === null ? undefined : v));

const nullableOptionalRelativeDate = RelativeDateSchema.nullable()
  .optional()
  .transform((v) => (v === null ? undefined : v));

export const AddUdhaarSchema = z.object({
  action: z.literal('add_udhaar'),
  customerName: z.string().min(1),
  amount: z.number().gt(0),
  currency: z.literal('INR').default('INR'),
  relativeDate: nullableOptionalRelativeDate,
  confidence: z.number().min(0).max(1),
});

export const RecordPaymentSchema = z.object({
  action: z.literal('record_payment'),
  customerName: z.string().min(1),
  amount: z.number().gt(0),
  currency: z.literal('INR').default('INR'),
  relativeDate: nullableOptionalRelativeDate,
  confidence: z.number().min(0).max(1),
});

export const AddStockSchema = z.object({
  action: z.literal('add_stock'),
  productName: z.string().min(1),
  quantity: z.number().gt(0),
  unit: UnitSchema,
  relativeDate: nullableOptionalRelativeDate,
  confidence: z.number().min(0).max(1),
});

export const RemoveStockSchema = z.object({
  action: z.literal('remove_stock'),
  productName: z.string().min(1),
  quantity: z.number().gt(0),
  unit: UnitSchema,
  reason: nullableOptionalString,
  relativeDate: nullableOptionalRelativeDate,
  confidence: z.number().min(0).max(1),
});

export const QuerySchema = z.object({
  action: z.literal('query'),
  queryType: QueryTypeSchema,
  customerName: nullableOptionalString,
  productName: nullableOptionalString,
  relativeDate: nullableOptionalRelativeDate,
  confidence: z.number().min(0).max(1),
});

export const NeedsClarificationSchema = z.object({
  action: z.literal('needs_clarification'),
  clarify: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const CommandSchema = z.discriminatedUnion('action', [
  AddUdhaarSchema,
  RecordPaymentSchema,
  AddStockSchema,
  RemoveStockSchema,
  QuerySchema,
  NeedsClarificationSchema,
]);

export type AddUdhaarCommand = z.infer<typeof AddUdhaarSchema>;
export type RecordPaymentCommand = z.infer<typeof RecordPaymentSchema>;
export type AddStockCommand = z.infer<typeof AddStockSchema>;
export type RemoveStockCommand = z.infer<typeof RemoveStockSchema>;
export type QueryCommand = z.infer<typeof QuerySchema>;
export type NeedsClarificationCommand = z.infer<typeof NeedsClarificationSchema>;

export type ExecutableCommand =
  | AddUdhaarCommand
  | RecordPaymentCommand
  | AddStockCommand
  | RemoveStockCommand
  | QueryCommand;

export type Command = z.infer<typeof CommandSchema>;
