/**
 * Author: Đạt Võ - https://github.com/datvt243
 * Date: `--/--`
 * Description: Class-based NoSQL Injection Protection
 */

export class QuerySafe {
  private readonly allowedFields: string[];

  constructor(allowedFields: string[]) {
    this.allowedFields = allowedFields;
  }

  safeQuery(baseQuery: Record<string, unknown> = {}, userInput: Record<string, unknown> = {}): Record<string, unknown> {
    const sanitized: Record<string, unknown> = { ...baseQuery };

    for (const [key, value] of Object.entries(userInput)) {
      if (
        this.allowedFields.includes(key) &&
        typeof value === 'string' &&
        !value.includes('$') &&
        !value.includes('javascript:') &&
        value.trim().length > 0
      ) {
        sanitized[key] = value.trim();
      }
    }
    return sanitized;
  }

  whitelistSelect(inputFields: string[]): string {
    const safeFields = inputFields.filter(
      (field) => this.allowedFields.includes(field) && !field.includes('$') && !field.includes('.'),
    );
    return safeFields.join(' ');
  }
}

// Pre-configured instances
export const candidateQuerySafe = new QuerySafe([
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'marital',
  'birthday',
  'address',
  'introduction',
  'github',
  'linkedin',
  'website',
  'slug',
]);

export const idQuerySafe = new QuerySafe(['_id', 'candidateId', 'email']);
