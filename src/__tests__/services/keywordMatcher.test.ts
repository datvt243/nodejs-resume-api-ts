import { extractKeywords, matchKeywords } from '@/services/keywordMatcher';

describe('extractKeywords', () => {
  it('resolves aliases to one canonical form (vue/vuejs/vue.js)', () => {
    expect(extractKeywords('Looking for a Vue.js developer')).toContain('vue');
    expect(extractKeywords('experience with vuejs required')).toContain('vue');
    expect(extractKeywords('comfortable with vue')).toContain('vue');
  });

  it('resolves ts/typescript to the same canonical form', () => {
    expect(extractKeywords('must know TypeScript')).toContain('typescript');
    expect(extractKeywords('strong TS skills')).toContain('typescript');
  });

  it('resolves reactjs/react to the same canonical form', () => {
    expect(extractKeywords('React experience needed')).toContain('react');
    expect(extractKeywords('built with ReactJS')).toContain('react');
  });

  it('is case-insensitive', () => {
    expect(extractKeywords('DOCKER and KUBERNETES')).toEqual(new Set(['docker', 'kubernetes']));
  });

  it('does not false-positive match a keyword as a substring of another word', () => {
    expect(extractKeywords('I am going to the store')).not.toContain('golang');
    expect(extractKeywords('javascript')).not.toContain('java');
  });

  it('does not break on Vietnamese diacritics in surrounding text', () => {
    const keywords = extractKeywords('Ứng viên cần biết TypeScript và Docker, có kinh nghiệm với MongoDB');
    expect(keywords).toEqual(new Set(['typescript', 'docker', 'mongodb']));
  });

  it('matches multi-word and symbol-bearing keywords (SAP Fiori, .NET, C#)', () => {
    expect(extractKeywords('Experience with SAP Fiori required')).toContain('sap fiori');
    expect(extractKeywords('Built on .NET')).toContain('.net');
    expect(extractKeywords('C# backend developer')).toContain('c#');
  });
});

describe('matchKeywords', () => {
  it('reports matched and missing keywords with coverage', () => {
    const jd = 'We need a Vue.js developer who knows TypeScript, Vitest, and Docker.';
    const candidateText = 'Experienced with Vue, TypeScript, Jest, and Docker.';

    const result = matchKeywords(jd, candidateText);

    expect(result.matched).toEqual(expect.arrayContaining(['docker', 'typescript', 'vue']));
    expect(result.missing).toContain('vitest');
    expect(result.coverage).toBeCloseTo(3 / 4);
  });

  it('returns coverage 0 when the JD has no recognized keywords', () => {
    const result = matchKeywords('We need a great communicator and team player.', 'Some candidate text.');
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual([]);
    expect(result.coverage).toBe(0);
  });

  it('returns full coverage when every JD keyword is present in the candidate text', () => {
    const result = matchKeywords('Needs React and Jest.', 'Skilled in React and Jest.');
    expect(result.missing).toEqual([]);
    expect(result.coverage).toBe(1);
  });
});
