import { AuthController } from '../../modules/auth/auth.controller';
import { AssessmentsController } from '../../modules/code-runner/presentation/controllers/assessments.controller';

const LIMIT_KEY = 'THROTTLER:LIMITdefault';

function limitOf(target: object, method: string): number | undefined {
  const handler = (target as Record<string, unknown>)[method];
  return Reflect.getMetadata(LIMIT_KEY, handler as object) as number | undefined;
}

describe('rate limits', () => {
  it.each([
    ['register', 5],
    ['login', 10],
    ['refresh', 30],
  ])('limits auth %s to %i requests per minute', (method, limit) => {
    expect(limitOf(AuthController.prototype, method)).toBe(limit);
  });

  it.each(['run', 'submit'])('limits code execution %s', (method) => {
    expect(limitOf(AssessmentsController.prototype, method)).toBe(10);
  });
});
