import { describe, expect, it } from 'vitest';
import { normalizeName, resolveEntity } from '../src/ai/validators';

const list = [
  { id: '1', name: 'Ramesh' },
  { id: '2', name: 'Ramesh Sharma' },
  { id: '3', name: 'Mohan Verma' },
  { id: '4', name: 'Mohan Gupta' },
  { id: '5', name: 'Suresh Sharma' },
];

describe('normalizeName', () => {
  it('drops honorifics and punctuation', () => {
    expect(normalizeName('Ramesh bhai')).toBe('ramesh');
    expect(normalizeName('Sharma ji')).toBe('sharma');
    expect(normalizeName('  RAMESH,  Sharma. ')).toBe('ramesh sharma');
  });
});

describe('resolveEntity', () => {
  it('prefers an exact match over partial matches', () => {
    expect(resolveEntity('Ramesh', list)).toEqual({ status: 'matched', entity: list[0] });
    expect(resolveEntity('Ramesh bhai', list)).toEqual({ status: 'matched', entity: list[0] });
  });
  it('accepts a unique whole-token partial ("Sharma ji" -> Suresh Sharma is NOT unique here)', () => {
    expect(resolveEntity('Verma', list)).toEqual({ status: 'matched', entity: list[2] });
    expect(resolveEntity('Sharma ji', list).status).toBe('ambiguous');
  });
  it('is ambiguous for shared first names', () => {
    const r = resolveEntity('Mohan', list);
    expect(r.status).toBe('ambiguous');
  });
  it('never matches a longer query to a shorter candidate', () => {
    expect(resolveEntity('Ramesh Gupta', [{ id: '1', name: 'Ramesh' }]).status).toBe('not_found');
  });
  it('returns not_found for unknown or empty names and ignores substring-only overlap', () => {
    expect(resolveEntity('Kishan', list).status).toBe('not_found');
    expect(resolveEntity('', list).status).toBe('not_found');
    expect(resolveEntity('Ram', list).status).toBe('not_found');
  });
  it('does not leak candidates it was not given (tenant isolation by construction)', () => {
    expect(resolveEntity('Ramesh', []).status).toBe('not_found');
  });
});
