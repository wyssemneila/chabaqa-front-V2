import {
  parseJsonObject,
  validateQuizResponse,
} from './ai-tutor-response.validator';

describe('ai-tutor-response.validator', () => {
  const allowed = new Set(['s1', 's2']);

  it('accepts quiz with object-shaped options and 1-based correctIndex', () => {
    const result = validateQuizResponse(
      {
        questions: [
          {
            question: 'What is X?',
            options: [
              { text: 'Wrong' },
              { label: 'Right' },
              { value: 'Also wrong' },
            ],
            correctIndex: 'B',
            explanation: 'Because.',
          },
        ],
      },
      allowed,
      4,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.questions).toHaveLength(1);
      expect(result.value.questions[0].correctIndex).toBe(1);
      expect(result.value.questions[0].options).toEqual([
        'Wrong',
        'Right',
        'Also wrong',
      ]);
    }
  });

  it('strips invalid sourceId instead of dropping the question', () => {
    const result = validateQuizResponse(
      {
        questions: [
          {
            question: 'Q?',
            options: ['A', 'B'],
            correctIndex: 0,
            sourceId: 'invalid',
          },
        ],
      },
      allowed,
      4,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.questions[0].sourceId).toBeUndefined();
    }
  });

  it('parses fenced JSON arrays for quiz', () => {
    const parsed = parseJsonObject(
      '```json\n[{"question":"Q?","options":["A","B"],"correctIndex":1,"explanation":""}]\n```',
    );
    expect(Array.isArray(parsed)).toBe(true);
    const validated = validateQuizResponse(parsed, allowed, 4);
    expect(validated.ok).toBe(true);
  });
});
