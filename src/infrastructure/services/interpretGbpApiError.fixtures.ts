import type { GbpConnectionStatus } from '@/core/entities/GbpConnection'

/**
 * Documented test cases for `interpretGbpApiError` (plan §8 Q2 — no test
 * framework installed in this repo; wire these into whichever runner gets
 * adopted, e.g.:
 *   for (const { description, input, expected } of GBP_ERROR_INTERPRETER_FIXTURES) {
 *     it(description, () => expect(interpretGbpApiError(input)).toBe(expected))
 *   }
 */
export interface GbpErrorInterpreterFixture {
  description: string
  input: unknown
  expected: GbpConnectionStatus
}

export const GBP_ERROR_INTERPRETER_FIXTURES: GbpErrorInterpreterFixture[] = [
  {
    description: '429 with quota_limit_value "0" (project not yet approved) → pending_api_approval',
    input: {
      error: {
        code: 429,
        message: 'Quota exceeded for quota metric...',
        status: 'RESOURCE_EXHAUSTED',
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'RATE_LIMIT_EXCEEDED',
            domain: 'googleapis.com',
            metadata: {
              service: 'mybusinessaccountmanagement.googleapis.com',
              quota_metric: 'mybusinessaccountmanagement.googleapis.com/default',
              quota_limit_value: '0',
            },
          },
        ],
      },
    },
    expected: 'pending_api_approval',
  },
  {
    description: '429 with quota_limit_value "300" (real, approved quota exhausted) → rate_limited',
    input: {
      error: {
        code: 429,
        message: 'Quota exceeded for quota metric...',
        status: 'RESOURCE_EXHAUSTED',
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'RATE_LIMIT_EXCEEDED',
            domain: 'googleapis.com',
            metadata: {
              service: 'mybusinessaccountmanagement.googleapis.com',
              quota_metric: 'mybusinessaccountmanagement.googleapis.com/default',
              quota_limit_value: '300',
            },
          },
        ],
      },
    },
    expected: 'rate_limited',
  },
  {
    description: '429 without details → rate_limited (fail open, not pending-approval)',
    input: { error: { code: 429, status: 'RESOURCE_EXHAUSTED' } },
    expected: 'rate_limited',
  },
  {
    description: '401 → auth_error',
    input: { error: { code: 401, status: 'UNAUTHENTICATED' } },
    expected: 'auth_error',
  },
  {
    description: '403 → auth_error',
    input: { error: { code: 403, status: 'PERMISSION_DENIED' } },
    expected: 'auth_error',
  },
  {
    description: '500 → error',
    input: { error: { code: 500, status: 'INTERNAL' } },
    expected: 'error',
  },
  {
    description: 'undefined → error (never throws)',
    input: undefined,
    expected: 'error',
  },
  {
    description: 'arbitrary unrelated object → error (never throws)',
    input: { foo: 'bar' },
    expected: 'error',
  },
]
