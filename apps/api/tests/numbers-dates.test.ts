import { describe, expect, it } from 'vitest';
import { extractNumberMentions, normalizeUnit, scanUnits } from '../src/ai/numbers';
import { resolveRelativeDate } from '../src/ai/dates';

const amounts = (t: string) => extractNumberMentions(t).filter((m) => m.kind === 'amount').map((m) => m.value);
const quantities = (t: string) => extractNumberMentions(t).filter((m) => m.kind === 'quantity').map((m) => [m.value, m.unit]);

describe('Indian amount expressions', () => {
  it.each([
    ['Ramesh ko 500 ka udhaar', 500],
    ['₹500 de diye', 500],
    ['500 rupees', 500],
    ['500 rupaye', 500],
    ['paanch sau', 500],
    ['dhai sau rupaye', 250],
    ['dedh sau', 150],
    ['ek hazaar', 1000],
    ['do hazaar', 2000],
    ['1,500 ka udhaar', 1500],
    ['sau rupaye', 100],
    ['५०० रुपये', 500],
    ['ek lakh', 100000],
  ])('%s -> %d', (text, expected) => {
    expect(amounts(text)).toEqual([expected]);
  });
});

describe('quantity and unit expressions', () => {
  it.each([
    ['5 kg', [[5, 'kg']]],
    ['paanch kilo aata', [[5, 'kg']]],
    ['10 litre doodh', [[10, 'litre']]],
    ['20 packets', [[20, 'packet']]],
    ['5 pieces', [[5, 'piece']]],
    ['dhai kilo chini', [[2.5, 'kg']]],
    ['aadha kilo', [[0.5, 'kg']]],
  ])('%s', (text, expected) => {
    expect(quantities(text)).toEqual(expected);
  });

  it('does not count a quantity as an amount', () => {
    expect(amounts('Aata ke 10 kilo add karo')).toEqual([]);
  });

  it('flags unsupported units instead of guessing', () => {
    expect(scanUnits('500 gram jeera').unsupported).toBe(true);
    expect(scanUnits('500 gram jeera').supported.size).toBe(0);
    expect(normalizeUnit('Kilo')).toBe('kg');
    expect(normalizeUnit('bori')).toBeUndefined();
  });
});

describe('relative dates (reference Sunday 2026-11-15, Asia/Kolkata)', () => {
  const ref = new Date('2026-11-15T06:00:00Z');
  const tz = 'Asia/Kolkata';
  it('today / yesterday / day before', () => {
    expect(resolveRelativeDate('today', ref, tz)).toEqual({ from: '2026-11-15', to: '2026-11-15' });
    expect(resolveRelativeDate('yesterday', ref, tz)).toEqual({ from: '2026-11-14', to: '2026-11-14' });
    expect(resolveRelativeDate('day_before_yesterday', ref, tz)).toEqual({ from: '2026-11-13', to: '2026-11-13' });
  });
  it('last week is the previous Mon-Sun week; last month the previous calendar month', () => {
    expect(resolveRelativeDate('last_week', ref, tz)).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(resolveRelativeDate('last_month', ref, tz)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });
  it('uses the store timezone, not UTC (20:00Z is already tomorrow in IST)', () => {
    expect(resolveRelativeDate('today', new Date('2026-11-14T20:00:00Z'), tz).from).toBe('2026-11-15');
  });
  it('handles January -> December rollover', () => {
    expect(resolveRelativeDate('last_month', new Date('2027-01-10T06:00:00Z'), tz)).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
});
