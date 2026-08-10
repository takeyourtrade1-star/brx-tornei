import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('match-gap staging rollout guardrails', () => {
  const script = readFileSync(
    resolve(root, 'scripts/preflight-match-gap-staging.sh'),
    'utf8',
  );
  const runbook = readFileSync(
    resolve(root, 'docs/MATCH_GAP_STAGING_RUNBOOK.md'),
    'utf8',
  );

  it('requires an explicit staging account and rejects production state', () => {
    expect(script).toContain('EXPECTED_STAGING_AWS_ACCOUNT_ID');
    expect(script).toContain('tournaments-staging');
    expect(script).toContain('Production Terraform state key is forbidden');
    expect(script).toContain('Production Terraform state bucket is forbidden');
    expect(script).toContain('get-caller-identity');
  });

  it('checks state protections and secret parity without writes', () => {
    expect(script).toContain('get-bucket-versioning');
    expect(script).toContain('get-bucket-encryption');
    expect(script).toContain('get-public-access-block');
    expect(script).toContain('Staff and Tournaments staging broker tokens do not match');
    expect(script).not.toContain('put-parameter');
    expect(script).not.toContain('terraform apply');
    expect(script).not.toMatch(/echo[^\n]*(TOURNAMENTS_TOKEN|STAFF_TOKEN)/);
  });

  it('documents direct and TURN cases plus immediate deletion', () => {
    expect(runbook).toContain('P2P diretto');
    expect(runbook).toContain('P2P via TURN');
    expect(runbook).toContain('oggetti S3 assenti subito dopo la risposta');
    expect(runbook).toMatch(/non eseguire downgrade distruttivi/i);
  });
});
