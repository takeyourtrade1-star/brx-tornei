import { Counter, Rate, Trend } from 'k6/metrics';

export const criticalFailures = new Counter('critical_failures');
export const rateLimited = new Counter('rate_limited_responses');
export const serverErrors = new Counter('server_error_responses');
export const operationDuration = new Trend('operation_duration', true);
export const mutationDuration = new Trend('mutation_duration', true);
export const readDuration = new Trend('read_duration', true);
export const wsAuthenticated = new Rate('ws_authenticated');
export const wsUnexpectedClose = new Counter('ws_unexpected_close');
export const wsTicketToAck = new Trend('ws_ticket_to_ack', true);
export const lifecycleCompleted = new Rate('lifecycle_completed');
export const resultCompleted = new Rate('result_completed');

export function recordHttp(response, operation, expectedStatuses, kind = 'read') {
  const tags = { operation, kind };
  const expected = expectedStatuses.includes(response.status);
  operationDuration.add(response.timings.duration, tags);
  (kind === 'mutation' ? mutationDuration : readDuration).add(response.timings.duration, tags);
  if (response.status === 429) rateLimited.add(1, tags);
  if (response.status >= 500) serverErrors.add(1, tags);
  if (!expected) criticalFailures.add(1, { ...tags, status: String(response.status) });
  return expected;
}
