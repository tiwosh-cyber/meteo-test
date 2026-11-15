import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAuth, validateWeather } from '../src/validation.js';

// Source: Notion 02 — Cadrage produit. Only frontend validation is covered here.
// Auth/session: AC-001,003–005; roles/RLS: AC-006–008,011–012,015;
// persistence: AC-013–014 remain integration criteria, never simulated.
test('F-001/002 · US-001/002 · AC-002/004: invalid credentials have field errors', () => {
  assert.deepEqual(Object.keys(validateAuth({ email: '', password: '' })), ['email', 'password']);
  assert.ok(validateAuth({ email: 'invalid@', password: '12345678' }).email);
  assert.ok(validateAuth({ email: 'a@example.com', password: '123' }, true).password);
  assert.deepEqual(validateAuth({ email: ' a@example.com ', password: 'long-password' }, true), {});
  assert.deepEqual(validateAuth({ email: 'a@example.com', password: 'short' }), {});
});

test('F-006 · US-006 · AC-013: numeric values and controlled weather conditions', () => {
  for (const humidity of ['0', '100', '45.5']) {
    assert.deepEqual(validateWeather({ temperature: '-12.5', condition: 'Pluvieux', humidity }), {});
  }
  for (const temperature of ['', ' ', 'Infinity', 'not-a-number']) {
    assert.ok(validateWeather({ temperature, condition: 'Ensoleillé', humidity: '45' }).temperature);
  }
  for (const humidity of ['', ' ', '-1', '101', 'Infinity', 'abc']) {
    assert.ok(validateWeather({ temperature: '22', condition: 'Nuageux', humidity }).humidity);
  }
  assert.ok(validateWeather({ temperature: '22', condition: 'unknown', humidity: '45' }).condition);
  assert.deepEqual(validateWeather({ temperature: '26', condition: 'Orageux', humidity: '35' }), {});
});
