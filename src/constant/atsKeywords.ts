/**
 * Curated tech-keyword dictionary for the ATS self-check's job-description
 * keyword matcher (`services/keywordMatcher.ts`). Each entry's `canonical`
 * form is what gets reported back in `matched`/`missing`; `aliases` are the
 * different real-world spellings that should all resolve to that one
 * canonical form (e.g. "vuejs"/"vue.js"/"vue" all mean the same skill).
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
export interface AtsKeywordEntry {
  canonical: string;
  aliases: string[];
}

export type AtsKeywordCategory = 'languages' | 'frameworks' | 'testing' | 'tooling' | 'cloud' | 'sap';

export const ATS_KEYWORDS: Record<AtsKeywordCategory, AtsKeywordEntry[]> = {
  languages: [
    // No bare "js" alias: it's a word-boundary match inside ".js"-suffixed
    // framework names (vue.js, node.js, express.js, next.js), which are
    // already their own dictionary entries — a bare "js" alias would
    // double-count those as a "javascript" hit that was never actually
    // stated separately.
    { canonical: 'javascript', aliases: ['javascript'] },
    { canonical: 'typescript', aliases: ['typescript', 'ts'] },
    { canonical: 'python', aliases: ['python'] },
    { canonical: 'java', aliases: ['java'] },
    { canonical: 'c#', aliases: ['c#', 'csharp', 'c-sharp'] },
    { canonical: 'php', aliases: ['php'] },
    { canonical: 'golang', aliases: ['golang', 'go'] },
    { canonical: 'ruby', aliases: ['ruby'] },
    { canonical: 'kotlin', aliases: ['kotlin'] },
    { canonical: 'swift', aliases: ['swift'] },
    { canonical: 'sql', aliases: ['sql'] },
    { canonical: 'abap', aliases: ['abap'] },
  ],
  frameworks: [
    // Bare "node" is deliberately excluded as an alias — too generic
    // (graph/network "node", load-balancer "node") to safely match on
    // its own; "node.js"/"nodejs" are unambiguous.
    { canonical: 'node.js', aliases: ['node.js', 'nodejs'] },
    { canonical: 'react', aliases: ['react', 'reactjs', 'react.js'] },
    { canonical: 'vue', aliases: ['vue', 'vuejs', 'vue.js'] },
    { canonical: 'angular', aliases: ['angular', 'angularjs'] },
    { canonical: 'nextjs', aliases: ['nextjs', 'next.js', 'next'] },
    { canonical: 'nestjs', aliases: ['nestjs', 'nest.js', 'nest'] },
    { canonical: 'express', aliases: ['express', 'expressjs', 'express.js'] },
    { canonical: 'django', aliases: ['django'] },
    { canonical: 'flask', aliases: ['flask'] },
    { canonical: 'spring', aliases: ['spring', 'spring boot', 'springboot'] },
    { canonical: 'laravel', aliases: ['laravel'] },
    { canonical: '.net', aliases: ['.net', 'dotnet', 'asp.net'] },
  ],
  testing: [
    { canonical: 'jest', aliases: ['jest'] },
    { canonical: 'vitest', aliases: ['vitest'] },
    { canonical: 'mocha', aliases: ['mocha'] },
    { canonical: 'cypress', aliases: ['cypress'] },
    { canonical: 'playwright', aliases: ['playwright'] },
    { canonical: 'selenium', aliases: ['selenium'] },
    { canonical: 'junit', aliases: ['junit'] },
    { canonical: 'pytest', aliases: ['pytest'] },
  ],
  tooling: [
    { canonical: 'docker', aliases: ['docker'] },
    { canonical: 'kubernetes', aliases: ['kubernetes', 'k8s'] },
    { canonical: 'git', aliases: ['git'] },
    { canonical: 'webpack', aliases: ['webpack'] },
    { canonical: 'vite', aliases: ['vite'] },
    { canonical: 'eslint', aliases: ['eslint'] },
    { canonical: 'ci/cd', aliases: ['ci/cd', 'cicd', 'ci-cd'] },
    { canonical: 'jenkins', aliases: ['jenkins'] },
    { canonical: 'github actions', aliases: ['github actions', 'githubactions'] },
    { canonical: 'graphql', aliases: ['graphql'] },
    { canonical: 'redis', aliases: ['redis'] },
    { canonical: 'mongodb', aliases: ['mongodb', 'mongo'] },
    { canonical: 'postgresql', aliases: ['postgresql', 'postgres'] },
    { canonical: 'mysql', aliases: ['mysql'] },
  ],
  cloud: [
    { canonical: 'aws', aliases: ['aws', 'amazon web services'] },
    { canonical: 'gcp', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
    { canonical: 'azure', aliases: ['azure', 'microsoft azure'] },
    { canonical: 'terraform', aliases: ['terraform'] },
    { canonical: 'serverless', aliases: ['serverless'] },
  ],
  sap: [
    { canonical: 'sap', aliases: ['sap'] },
    { canonical: 'sap abap', aliases: ['sap abap'] },
    { canonical: 'sap fiori', aliases: ['sap fiori', 'fiori'] },
    { canonical: 'sap hana', aliases: ['sap hana', 'hana'] },
    { canonical: 'sap mm', aliases: ['sap mm'] },
    { canonical: 'sap sd', aliases: ['sap sd'] },
    { canonical: 'sap fi', aliases: ['sap fi'] },
    { canonical: 'sap co', aliases: ['sap co'] },
  ],
};

/** Flat list of every entry across all categories, for lookup by alias. */
export const ALL_ATS_KEYWORDS: AtsKeywordEntry[] = Object.values(ATS_KEYWORDS).flat();
