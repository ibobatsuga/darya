import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bodyMetrics,
  validProfile,
  safetyCheck,
  eligibleProducts,
  sharePayload,
  escapeHTML,
  safeOrderUrl,
  lifestyleScore,
  localDay,
} from '../src/domain.js';

test('bodyMetrics calculates BMI, BMR, and TDEE correctly', () => {
  const metrics = bodyMetrics({ weight: 70, height: 175, age: 30, sex: 'male', activity: 'moderate' });
  assert.ok(metrics);
  assert.equal(typeof metrics.bmi, 'number');
  assert.equal(typeof metrics.bmr, 'number');
  assert.equal(typeof metrics.tdee, 'number');
  assert.equal(metrics.bmi, 22.9);
  assert.equal(metrics.bmr, 1649);
  assert.equal(metrics.tdee, 2556);
});

test('bodyMetrics returns null for invalid or out of range inputs', () => {
  assert.equal(bodyMetrics({ weight: 20, height: 175, age: 30, sex: 'male' }), null);
  assert.equal(bodyMetrics({ weight: 70, height: 50, age: 30, sex: 'male' }), null);
  assert.equal(bodyMetrics({ weight: 70, height: 175, age: 10, sex: 'male' }), null);
  assert.equal(bodyMetrics({ weight: 70, height: 175, age: 30, sex: 'other' }), null);
  assert.equal(bodyMetrics({ weight: 'abc', height: 175, age: 30, sex: 'male' }), null);
});

test('validProfile validates profile correctly', () => {
  const valid = {
    name: 'Budi',
    age: 28,
    sex: 'male',
    weight: 68,
    height: 172,
    goals: ['energy'],
    safety: { allergy: 'no', condition: 'no', medication: 'no', pregnancy: 'no', restriction: 'no' },
    consent: true,
  };
  assert.equal(validProfile(valid), true);

  assert.equal(validProfile({ ...valid, consent: false }), false);
  assert.equal(validProfile({ ...valid, goals: [] }), false);
  assert.equal(validProfile({ ...valid, goals: ['a', 'b', 'c'] }), false);
  assert.equal(validProfile({ ...valid, name: '' }), false);
  assert.equal(validProfile({ ...valid, safety: { ...valid.safety, allergy: 'maybe' } }), false);
});

test('safetyCheck blocks unsafe conditions or medical keywords', () => {
  const cleanProfile = {
    name: 'Siti',
    age: 26,
    sex: 'female',
    weight: 55,
    height: 160,
    goals: ['skin'],
    safety: { allergy: 'no', condition: 'no', medication: 'no', pregnancy: 'no', restriction: 'no' },
    consent: true,
  };

  const safeRes = safetyCheck(cleanProfile, 'Rekomendasikan vitamin untuk kulit kusam');
  assert.equal(safeRes.allowed, true);

  const allergyProfile = { ...cleanProfile, safety: { ...cleanProfile.safety, allergy: 'yes' } };
  const allergyRes = safetyCheck(allergyProfile, 'Vitamin kulit');
  assert.equal(allergyRes.allowed, false);
  assert.equal(allergyRes.reason, 'safety_flag');

  const emergencyRes = safetyCheck(cleanProfile, 'Saya sesak napas dan nyeri dada');
  assert.equal(emergencyRes.allowed, false);
  assert.equal(emergencyRes.reason, 'message_flag');

  const diabetesRes = safetyCheck(cleanProfile, 'Obat untuk penderita diabetes');
  assert.equal(diabetesRes.allowed, false);
  assert.equal(diabetesRes.reason, 'message_flag');
});

test('eligibleProducts filters verified and safe products matching goals', () => {
  const profile = {
    name: 'Dewi',
    age: 29,
    sex: 'female',
    weight: 52,
    height: 158,
    goals: ['skin'],
    safety: { allergy: 'no', condition: 'no', medication: 'no', pregnancy: 'no', restriction: 'no' },
    consent: true,
  };

  const mockProducts = [
    { id: 'p1', verified: true, kind: 'supplement', composition: 'Vit E', dosage: '1x1', warnings: 'Hati-hati', goals: ['skin'] },
    { id: 'p2', verified: false, kind: 'supplement', composition: 'Vit C', dosage: '1x1', warnings: 'Aman', goals: ['skin'] },
    { id: 'p3', verified: true, kind: 'prescription', composition: 'Rx', dosage: '1x1', warnings: 'Resep dokter', goals: ['skin'] },
    { id: 'p4', verified: true, kind: 'supplement', composition: 'Vit B', dosage: '1x1', warnings: 'Aman', goals: ['energy'] },
  ];

  const matched = eligibleProducts(mockProducts, profile, 'Info kulit');
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'p1');
});

test('escapeHTML sanitizes dangerous HTML characters', () => {
  assert.equal(escapeHTML('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHTML("Tom & Jerry's"), 'Tom &amp; Jerry&#039;s');
});

test('safeOrderUrl only permits https and allowed hostnames', () => {
  const allowed = ['darya-varia.com', 'tokopedia.com'];
  assert.equal(safeOrderUrl('https://tokopedia.com/product/123', allowed), 'https://tokopedia.com/product/123');
  assert.equal(safeOrderUrl('https://malicious.com/phishing', allowed), null);
  assert.equal(safeOrderUrl('javascript:alert(1)', allowed), null);
  assert.equal(safeOrderUrl('http://tokopedia.com/insecure', allowed), null);
});

test('lifestyleScore calculates bounded score', () => {
  const score = lifestyleScore({ sleep: 8, exercise: 'often', stress: 'low' });
  assert.equal(score, 100);
  const lowScore = lifestyleScore({ sleep: 4, exercise: 'rarely', stress: 'high' });
  assert.ok(lowScore >= 0 && lowScore <= 100);
});

test('localDay returns YYYY-MM-DD string', () => {
  const day = localDay();
  assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
});
