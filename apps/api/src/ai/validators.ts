const HONORIFICS = new Set(['bhai', 'ji', 'seth', 'shri', 'babu', 'sahab', 'saheb', 'sir', 'madam']);

export function normalizeName(name: string): string {
  if (!name) return '';

  // Remove punctuation (commas, dots, dashes, quotes, etc.)
  const cleanPunctuation = name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');

  // Split into tokens
  const tokens = cleanPunctuation
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Filter out honorifics
  const filtered = tokens.filter((t) => !HONORIFICS.has(t));

  return filtered.join(' ');
}

export type EntityResolutionResult<T extends { id: string; name: string }> =
  | { status: 'matched'; entity: T }
  | { status: 'ambiguous'; candidates: T[] }
  | { status: 'not_found' };

export function resolveEntity<T extends { id: string; name: string }>(
  query: string,
  candidates: T[]
): EntityResolutionResult<T> {
  const normQuery = normalizeName(query);
  if (!normQuery || !candidates || candidates.length === 0) {
    return { status: 'not_found' };
  }

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  // Map candidates to their normalized forms and tokens
  const candidateMeta = candidates.map((c) => {
    const norm = normalizeName(c.name);
    return {
      entity: c,
      normalized: norm,
      tokens: norm.split(/\s+/).filter(Boolean),
    };
  });

  // 1. Check exact match: prefers exact match over partial matches
  const exactMatches = candidateMeta.filter((c) => c.normalized === normQuery);
  if (exactMatches.length === 1 && exactMatches[0]) {
    return { status: 'matched', entity: exactMatches[0].entity };
  }
  if (exactMatches.length > 1) {
    return { status: 'ambiguous', candidates: exactMatches.map((c) => c.entity) };
  }

  // 2. Token-based matching:
  // "never matches a longer query to a shorter candidate"
  // Each query token must match a whole candidate token.
  const partialMatches = candidateMeta.filter((c) => {
    if (queryTokens.length > c.tokens.length) {
      return false;
    }
    // All query tokens must be contained in candidate tokens as whole words
    return queryTokens.every((qTok) => c.tokens.includes(qTok));
  });

  if (partialMatches.length === 1 && partialMatches[0]) {
    return { status: 'matched', entity: partialMatches[0].entity };
  }

  if (partialMatches.length > 1) {
    return { status: 'ambiguous', candidates: partialMatches.map((c) => c.entity) };
  }

  return { status: 'not_found' };
}
