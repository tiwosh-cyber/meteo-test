// F-001/003/006 · AC-001/002/006–008/013–015: real anon, Visiteur and Manager sessions
// against the Supabase TEST project. Run: npm run test:rls (reads front-end/.env.local).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const env = process.env;
for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'TEST_VISITOR_EMAIL', 'TEST_VISITOR_PASSWORD', 'TEST_MANAGER_EMAIL', 'TEST_MANAGER_PASSWORD']) {
  assert.ok(env[name], `${name} manquant dans front-end/.env.local`);
}
const client = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
async function signedIn(email, password) {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email, password });
  assert.ifError(error);
  return c;
}
const seed = [
  { city: 'Paris', temperature: 22, condition: 'Ensoleillé', humidity: 45 },
  { city: 'Lyon', temperature: 18, condition: 'Nuageux', humidity: 60 },
  { city: 'Marseille', temperature: 26, condition: 'Ensoleillé', humidity: 35 },
];
const anon = client();
const visitor = await signedIn(env.TEST_VISITOR_EMAIL, env.TEST_VISITOR_PASSWORD);
const manager = await signedIn(env.TEST_MANAGER_EMAIL, env.TEST_MANAGER_PASSWORD);
const readParis = async () => (await manager.from('weather').select('*').eq('city', 'Paris').single()).data;

test.after(async () => {
  for (const { city, ...values } of seed) await manager.from('weather').update(values).eq('city', city);
});

test('AC-008: anonymous access to weather is refused', async () => {
  const read = await anon.from('weather').select('*');
  assert.ok(read.error || read.data.length === 0, 'anon must not read weather');
  const write = await anon.from('weather').update({ temperature: 99 }).eq('city', 'Paris').select();
  assert.ok(write.error || write.data.length === 0);
  assert.equal(Number((await readParis()).temperature), 22);
});

test('AC-009 (data): Visiteur reads the three cities', async () => {
  const { data, error } = await visitor.from('weather').select('city').order('city');
  assert.ifError(error);
  assert.deepEqual(data.map(row => row.city), ['Lyon', 'Marseille', 'Paris']);
});

test('AC-007/015: Visiteur direct writes are refused and data unchanged', async () => {
  const before = await readParis();
  const update = await visitor.from('weather').update({ temperature: 99 }).eq('city', 'Paris').select();
  assert.ok(update.error || update.data.length === 0, 'update must affect no row');
  assert.ok((await visitor.from('weather').insert({ city: 'Paris', temperature: 1, condition: 'Nuageux', humidity: 1 })).error);
  assert.ok((await visitor.from('weather').delete().eq('city', 'Paris')).error);
  assert.deepEqual(await readParis(), before);
});

test('AC-002/007: Visiteur cannot read or grant the Manager role', async () => {
  const { data: { user } } = await visitor.auth.getUser();
  const own = await visitor.from('managers').select('user_id');
  assert.ifError(own.error);
  assert.deepEqual(own.data, []);
  assert.ok((await visitor.from('managers').insert({ user_id: user.id })).error);
});

test('AC-006/013/014: Manager saves valid values and they persist', async () => {
  const role = await manager.from('managers').select('user_id');
  assert.equal(role.data.length, 1);
  const values = { temperature: -3.5, condition: 'Pluvieux', humidity: 100 };
  const { data, error } = await manager.from('weather').update(values).eq('city', 'Paris').select();
  assert.ifError(error);
  assert.equal(data.length, 1);
  const fresh = await signedIn(env.TEST_MANAGER_EMAIL, env.TEST_MANAGER_PASSWORD); // new session = fresh read
  const { data: row } = await fresh.from('weather').select('*').eq('city', 'Paris').single();
  assert.deepEqual({ temperature: Number(row.temperature), condition: row.condition, humidity: Number(row.humidity) }, values);
});

test('AC-013 (data): database rejects invalid values even from a Manager', async () => {
  for (const values of [{ humidity: 101 }, { humidity: -1 }, { condition: 'Neige' }, { temperature: 'Infinity' }, { temperature: 'NaN' }]) {
    const { error } = await manager.from('weather').update(values).eq('city', 'Lyon');
    assert.ok(error, `must reject ${JSON.stringify(values)}`);
  }
  assert.ok((await manager.from('weather').insert({ city: 'Nice', temperature: 1, condition: 'Nuageux', humidity: 1 })).error);
  assert.ok((await manager.from('weather').delete().eq('city', 'Lyon')).error);
});

// Creates a real account on each run: opt-in with RUN_SIGNUP_TEST=1, then delete it from the dashboard.
test('AC-001/002: sign-up opens a Visiteur session; duplicate email refused', { skip: !env.RUN_SIGNUP_TEST }, async () => {
  const email = env.TEST_VISITOR_EMAIL.replace('@', `+signup${Date.now()}@`);
  const c = client();
  const { data, error } = await c.auth.signUp({ email, password: 'Signup-test-123' });
  assert.ifError(error);
  assert.ok(data.session, 'session immediately available (no email confirmation)');
  assert.deepEqual((await c.from('managers').select('user_id')).data, []);
  const duplicate = await client().auth.signUp({ email, password: 'Signup-test-123' });
  assert.ok(duplicate.error, 'duplicate email refused');
});
