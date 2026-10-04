/**
 * Job-description keyword matcher for the ATS self-check endpoint.
 * Matches against the curated dictionary in `constant/atsKeywords.ts`,
 * collapsing real-world spelling variants (vue/vuejs/vue.js,
 * ts/typescript, reactjs/react, ...) to one canonical form via each
 * entry's `aliases` list, so neither side of the comparison has to agree
 * on exact spelling.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { ALL_ATS_KEYWORDS } from '@/constant/atsKeywords';

export interface KeywordMatchResult {
  matched: string[];
  missing: string[];
  coverage: number;
}

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (text: string): string => text.normalize('NFC').toLowerCase();

/**
 * Whole-word/phrase containment check (Unicode-aware), not a plain
 * substring test — avoids "java" matching inside "javascript" or "go"
 * matching inside "going".
 */
const containsAlias = (normalizedText: string, alias: string): boolean => {
  const normalizedAlias = normalize(alias);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(normalizedAlias)}(?![\\p{L}\\p{N}])`, 'u');
  return pattern.test(normalizedText);
};

/** Every canonical keyword from the dictionary found anywhere in `text`. */
export const extractKeywords = (text: string): Set<string> => {
  const normalized = normalize(text);
  const found = new Set<string>();
  for (const entry of ALL_ATS_KEYWORDS) {
    if (entry.aliases.some((alias) => containsAlias(normalized, alias))) {
      found.add(entry.canonical);
    }
  }
  return found;
};

export const matchKeywords = (jobDescription: string, candidateText: string): KeywordMatchResult => {
  const jdKeywords = extractKeywords(jobDescription);
  const candidateKeywords = extractKeywords(candidateText);

  const matched: string[] = [];
  const missing: string[] = [];
  for (const keyword of jdKeywords) {
    (candidateKeywords.has(keyword) ? matched : missing).push(keyword);
  }

  const total = matched.length + missing.length;
  const coverage = total === 0 ? 0 : matched.length / total;

  return { matched: matched.sort(), missing: missing.sort(), coverage };
};
