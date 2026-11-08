import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJSON, validateFoodEstimate, rankProducts } from '../server/ai.js';

test('parseJSON handles clean JSON, code blocks, and surrounding conversational text', () => {
  const clean = '{"name":"Apel","calories":52,"protein":0.3,"carbs":14,"fat":0.2}';
  assert.deepEqual(parseJSON(clean), { name: 'Apel', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 });

  const fenced = '```json\n{"ids":["p1","p2"]}\n```';
  assert.deepEqual(parseJSON(fenced), { ids: ['p1', 'p2'] });

  const conversational = 'Tentu! Berikut adalah perkiraan gizi makanan:\n```json\n{"name":"Tempe Goreng","calories":120,"protein":8,"carbs":5,"fat":7}\n```\nSemoga membantu!';
  assert.deepEqual(parseJSON(conversational), { name: 'Tempe Goreng', calories: 120, protein: 8, carbs: 5, fat: 7 });
});

test('parseJSON throws on invalid text or non-json input', () => {
  assert.throws(() => parseJSON(null), /AI_INVALID_JSON_INPUT/);
  assert.throws(() => parseJSON('Maaf saya tidak tahu.'), /AI_NO_JSON_FOUND/);
});

test('validateFoodEstimate validates and sanitizes estimate data', () => {
  const raw = { name: 'Nasi Putih', calories: 204.4, protein: 4.2, carbs: 44.1, fat: 0.4 };
  const valid = validateFoodEstimate(raw);
  assert.equal(valid.name, 'Nasi Putih');
  assert.equal(valid.calories, 204);
  assert.equal(valid.protein, 4.2);
  assert.equal(valid.estimated, true);

  assert.throws(() => validateFoodEstimate({ name: '', calories: 100, protein: 1, carbs: 1, fat: 1 }), /INVALID_FOOD_ESTIMATE/);
  assert.throws(() => validateFoodEstimate({ name: 'Food', calories: -5, protein: 1, carbs: 1, fat: 1 }), /INVALID_FOOD_ESTIMATE/);
  assert.throws(() => validateFoodEstimate({ name: 'Food', calories: 15000, protein: 1, carbs: 1, fat: 1 }), /INVALID_FOOD_ESTIMATE/);
  assert.throws(() => validateFoodEstimate({ name: 'Food', calories: 200, protein: 'many', carbs: 1, fat: 1 }), /INVALID_FOOD_ESTIMATE/);
});

test('rankProducts parses response and returns matched candidates', async () => {
  const candidates = [
    { id: 'enervon-c', goals: ['energy'], category: 'Vitamin', benefits: 'Daya tahan' },
    { id: 'natur-e', goals: ['skin'], category: 'Kulit', benefits: 'Kesehatan kulit' },
  ];

  const fakeFetcher = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: '```json\n{"ids":["enervon-c"]}\n```' } }],
    }),
  });

  const ranked = await rankProducts({ SAKELAR_API_KEY: 'test_key' }, candidates, ['energy'], fakeFetcher);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].id, 'enervon-c');
  assert.ok(ranked[0].disclaimer);
});
