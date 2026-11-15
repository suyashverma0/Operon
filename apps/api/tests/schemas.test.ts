import { describe, expect, it } from 'vitest';
import { CommandSchema } from '../src/ai/schemas';

describe('CommandSchema', () => {
  it('accepts each action and defaults currency to INR', () => {
    const r = CommandSchema.parse({ action: 'add_udhaar', customerName: 'Ramesh', amount: 500, confidence: 0.9 });
    expect(r).toMatchObject({ currency: 'INR', amount: 500 });
    expect(CommandSchema.safeParse({ action: 'add_stock', productName: 'Aata', quantity: 10, unit: 'kg', confidence: 0.9 }).success).toBe(true);
    expect(CommandSchema.safeParse({ action: 'query', queryType: 'greeting', confidence: 0.99 }).success).toBe(true);
  });

  it.each([
    ['negative amount', { action: 'add_udhaar', customerName: 'R', amount: -5, confidence: 0.9 }],
    ['zero amount', { action: 'record_payment', customerName: 'R', amount: 0, confidence: 0.9 }],
    ['string amount', { action: 'record_payment', customerName: 'R', amount: '500', confidence: 0.9 }],
    ['negative quantity', { action: 'remove_stock', productName: 'A', quantity: -2, unit: 'kg', confidence: 0.9 }],
    ['missing unit', { action: 'add_stock', productName: 'A', quantity: 2, confidence: 0.9 }],
    ['unsupported unit', { action: 'add_stock', productName: 'A', quantity: 2, unit: 'gram', confidence: 0.9 }],
    ['missing customer', { action: 'add_udhaar', amount: 5, confidence: 0.9 }],
    ['unknown action', { action: 'delete_customer', confidence: 0.9 }],
    ['confidence > 1', { action: 'query', queryType: 'greeting', confidence: 1.5 }],
    ['unknown query type', { action: 'query', queryType: 'everything', confidence: 0.9 }],
  ])('rejects %s', (_n, value) => {
    expect(CommandSchema.safeParse(value).success).toBe(false);
  });

  it('treats null optionals as absent', () => {
    const r = CommandSchema.parse({ action: 'remove_stock', productName: 'A', quantity: 1, unit: 'kg', reason: null, relativeDate: null, confidence: 0.9 });
    expect(r).toMatchObject({ reason: undefined, relativeDate: undefined });
  });

  it('strips invented transaction fields from a clarification', () => {
    const r = CommandSchema.parse({ action: 'needs_clarification', clarify: 'Kitne?', amount: 500, customerId: 'x9', confidence: 0.5 });
    expect(r).toEqual({ action: 'needs_clarification', clarify: 'Kitne?', confidence: 0.5 });
  });
});
