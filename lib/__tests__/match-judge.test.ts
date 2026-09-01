import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mapMatchJudgeState, mapMatchJudgeTurn } from '@/lib/data/match-judge-mapper';
import { matchJudgeRequestSchema } from '@/lib/validations/match-judge';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('match Judge contract', () => {
  it('valida UUID e domanda entro 1000 caratteri', () => {
    const valid = matchJudgeRequestSchema.safeParse({
      client_request_id: '3d6f0e2b-3d1a-4b6a-8b74-bb08e1c3a4c1',
      question: 'Posso rispondere a questa magia?',
    });
    expect(valid.success).toBe(true);
    expect(matchJudgeRequestSchema.safeParse({
      client_request_id: 'not-a-uuid',
      question: 'domanda',
    }).success).toBe(false);
    expect(matchJudgeRequestSchema.safeParse({
      client_request_id: '3d6f0e2b-3d1a-4b6a-8b74-bb08e1c3a4c1',
      question: 'x'.repeat(1001),
    }).success).toBe(false);
  });

  it('accetta la risposta 202 come turno processing senza ruling', () => {
    const turn = mapMatchJudgeTurn({
      data: {
        id: 'turn-1',
        sequence: 1,
        asked_by_user_id: 'player-1',
        question: 'Posso lanciare questa magia?',
        status: 'processing',
        created_at: '2026-09-01T10:00:00Z',
      },
    });
    expect(turn).toMatchObject({
      id: 'turn-1',
      status: 'processing',
      askedByUserId: 'player-1',
    });
    expect(turn?.reply).toBeUndefined();
  });

  it('mantiene gli ultimi 20 turni in ordine crescente', () => {
    const turns = Array.from({ length: 21 }, (_, index) => ({
      id: `turn-${index + 1}`,
      sequence: index + 1,
      question: `Domanda ${index + 1}`,
      status: 'completed',
      created_at: '2026-09-01T10:00:00Z',
    }));
    const state = mapMatchJudgeState({ judge: { status: 'idle', turns } });
    expect(state?.turns).toHaveLength(20);
    expect(state?.turns[0]?.id).toBe('turn-2');
    expect(state?.turns.at(-1)?.id).toBe('turn-21');
  });

  it('limita i campi strutturati ai limiti del contratto', () => {
    const turn = mapMatchJudgeTurn({
      id: 'turn-structured',
      question: 'Domanda',
      status: 'completed',
      steps: ['uno', 'due', 'tre', 'quattro'],
      rule_refs: ['CR 101', 'CR 102', 'CR 103'],
    });
    expect(turn?.steps).toEqual(['uno', 'due', 'tre']);
    expect(turn?.ruleRefs).toEqual(['CR 101', 'CR 102']);
  });
});

describe('Judge UI senza coda ottimistica', () => {
  it('sostituisce il composer durante processing e conserva il draft sugli errori', () => {
    const panel = readFileSync(
      join(ROOT, 'components/feature/tornei/match/match-judge.tsx'),
      'utf8',
    );
    const hook = readFileSync(join(ROOT, 'hooks/use-match-judge.ts'), 'utf8');
    const action = readFileSync(join(ROOT, 'actions/match-judge.ts'), 'utf8');
    expect(panel).toContain('processing ? (');
    expect(panel).toContain('Il campo resta bloccato fino alla risposta.');
    expect(hook).toContain('setError(result.error)');
    expect(hook).not.toContain('setDraft(cleanQuestion)');
    expect(action).toContain('JUDGE_BUSY');
  });

  it('intercetta Esc prima del contenitore fullscreen', () => {
    const panel = readFileSync(
      join(ROOT, 'components/feature/tornei/match/match-judge.tsx'),
      'utf8',
    );

    expect(panel).toContain("event.stopPropagation();\n      close();");
    expect(panel).toContain("window.addEventListener('keydown', onKeyDown, true)");
    expect(panel).toContain("window.removeEventListener('keydown', onKeyDown, true)");
  });
});
