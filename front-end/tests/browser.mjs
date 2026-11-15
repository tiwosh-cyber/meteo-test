import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = 'http://127.0.0.1:5173';
const chromePath = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert.ok(chromePath, 'Set CHROME_PATH to a Chromium browser executable.');
const artifacts = mkdtempSync(join(tmpdir(), 'meteo-test-'));
const chrome = spawn(chromePath, ['--headless', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${artifacts}`, 'about:blank'],
{ windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Browser startup timed out')), 10000);
    let output = '';
    chrome.stderr.on('data', chunk => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(new URL(match[1]).origin.replace('ws:', 'http:')); }
    });
    chrome.on('error', reject);
  });
  const pages = await (await fetch(`${endpoint}/json`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  const pending = new Map();
  const errors = [];
  let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      pending.set(id, message => { clearTimeout(timeout); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  }
  async function waitFor(expression, label) {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await sleep(100);
    }
    throw new Error(`Timed out: ${label || expression}`);
  }
  async function navigate(path, expected = path) {
    await send('Page.navigate', { url: base + path });
    await waitFor(`location.pathname === ${JSON.stringify(expected)} && Boolean(document.querySelector('h1'))`, `route ${path} -> ${expected}`);
  }
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function fill(selector, value) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2, commands: ['selectAll'] });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2 });
    await send('Input.insertText', { text: value });
  }
  async function select(selector, value) {
    await evaluate(`{ const element = document.querySelector(${JSON.stringify(selector)}); element.value = ${JSON.stringify(value)}; element.dispatchEvent(new Event('change', { bubbles: true })); }`);
  }
  async function screenshot(name) {
    const response = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(artifacts, `${name}.png`), Buffer.from(response.data, 'base64'));
  }
  await send('Page.enable');
  await send('Runtime.enable');

  // Real Supabase TEST project + test accounts from front-end/.env.local (never committed).
  for (const name of ['TEST_VISITOR_EMAIL', 'TEST_VISITOR_PASSWORD', 'TEST_MANAGER_EMAIL', 'TEST_MANAGER_PASSWORD']) assert.ok(process.env[name], `${name} manquant`);
  const sessionKeys = `Object.keys(localStorage).filter(key => /^sb-.*-auth-token$/.test(key)).length`;
  async function checkLayout(route) {
    assert.equal(await evaluate(`document.querySelectorAll('h1').length`), 1);
    assert.equal(await evaluate(`document.documentElement.lang`), 'fr');
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('input, select')).every(e => e.labels.length > 0)`), true);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: false });
      await sleep(80);
      assert.equal(await evaluate(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`), true, `${route}: overflow at ${width}px`);
      if (width === 390 || width === 1440) await screenshot(`${route.slice(1)}-${width}`);
    }
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
    assert.equal(await evaluate(`document.activeElement.matches(':focus-visible')`), true, `${route}: keyboard focus`);
  }
  async function signIn(email, password) {
    await navigate('/login');
    await fill('#email', email);
    await fill('#password', password);
    await click('button[type="submit"]');
    await waitFor(`location.pathname === '/weather' && Boolean(document.querySelector('.weather-main'))`, 'sign-in lands on /weather');
  }
  async function signOut() {
    await click('.account-button');
    await waitFor(`location.pathname === '/login' && Boolean(document.querySelector('h1'))`, 'sign-out lands on /login');
  }
  async function saveAdmin(temperature, condition, humidity) {
    await fill('#temperature', temperature);
    await select('#condition', condition);
    await fill('#humidity', humidity);
    await click('button[type="submit"]');
    await waitFor(`Boolean(document.querySelector('form .message-success')?.textContent.includes('enregistrée'))`, 'save success');
  }

  // AC-008 (UI): protected routes redirect to /login without a session.
  for (const route of ['/weather', '/admin']) await navigate(route, '/login');
  for (const route of ['/login', '/register']) {
    await navigate(route);
    await checkLayout(route);
    await click('button[type="submit"]');
    assert.equal(await evaluate(`document.querySelectorAll('[aria-invalid="true"]').length`), 2);
    assert.equal(await evaluate(`document.activeElement.id`), 'email');
    await fill('#email', 'test@example.com');
    await fill('#password', 'valid-password');
    await click('.password-toggle');
    assert.equal(await evaluate(`document.querySelector('#password').type`), 'text');
  }
  // AC-004: wrong password refused, no session.
  await navigate('/login');
  await fill('#email', process.env.TEST_VISITOR_EMAIL);
  await fill('#password', 'wrong-password-123');
  await click('button[type="submit"]');
  await waitFor(`Boolean(document.querySelector('form .message-error')?.textContent.includes('incorrect'))`, 'invalid credentials message');
  assert.equal(await evaluate('location.pathname'), '/login');
  assert.equal(await evaluate(sessionKeys), 0);
  // AC-002 (UI): duplicate email refused at sign-up, no session.
  await navigate('/register');
  await fill('#email', process.env.TEST_VISITOR_EMAIL);
  await fill('#password', 'another-password-123');
  await click('button[type="submit"]');
  await waitFor(`Boolean(document.querySelector('form .message-error')?.textContent.includes('existe déjà'))`, 'duplicate email message');
  assert.equal(await evaluate(sessionKeys), 0);

  // AC-003/009/012: Visiteur reads the three cities, no admin access.
  await signIn(process.env.TEST_VISITOR_EMAIL, process.env.TEST_VISITOR_PASSWORD);
  await checkLayout('/weather');
  for (const [city, temperature, condition, humidity] of [['Paris', '22', 'Ensoleillé', '45 %'], ['Lyon', '18', 'Nuageux', '60 %'], ['Marseille', '26', 'Ensoleillé', '35 %']]) {
    await select('#city', city);
    assert.equal(await evaluate(`document.querySelector('.temperature > span').textContent`), temperature);
    assert.equal(await evaluate(`document.querySelector('.condition').textContent`), condition);
    assert.equal(await evaluate(`document.querySelector('.humidity strong').textContent`), humidity);
  }
  await click('.city-card');
  assert.equal(await evaluate(`document.querySelector('#city').value`), 'Paris');
  assert.equal(await evaluate(`Boolean(document.querySelector('a[href="/admin"]'))`), false);
  await navigate('/admin');
  await waitFor(`Boolean(document.querySelector('.message-error'))`, 'admin refusal');
  assert.match(await evaluate(`document.querySelector('.message-error').textContent`), /Accès refusé/);
  assert.equal(await evaluate(`document.querySelectorAll('#temperature').length`), 0);
  // AC-005: after sign-out, protected routes need a new sign-in.
  await signOut();
  assert.equal(await evaluate(sessionKeys), 0);
  await navigate('/weather', '/login');

  // AC-006/011/013/014: Manager saves, value persists after reload.
  await signIn(process.env.TEST_MANAGER_EMAIL, process.env.TEST_MANAGER_PASSWORD);
  await waitFor(`Boolean(document.querySelector('a[href="/admin"]'))`, 'admin link for Manager');
  await click('a[href="/admin"]');
  await waitFor(`Boolean(document.querySelector('#temperature'))`, 'admin editor');
  await checkLayout('/admin');
  await fill('#humidity', '101');
  await click('button[type="submit"]');
  assert.equal(await evaluate(`document.querySelector('#humidity').getAttribute('aria-invalid')`), 'true');
  assert.equal(await evaluate(`document.querySelectorAll('.admin-preview .temperature').length`), 0);
  await saveAdmin('-12.5', 'Orageux', '50');
  await send('Page.reload');
  await waitFor(`location.pathname === '/admin' && document.querySelector('#temperature')?.value === '-12.5'`, 'persisted after reload');
  assert.equal(await evaluate(`document.querySelector('#condition').value`), 'Orageux');
  await navigate('/weather');
  await waitFor(`document.querySelector('.temperature > span')?.textContent === '-12.5'`, 'weather page shows saved value');
  await navigate('/admin');
  await waitFor(`document.querySelector('#temperature')?.value === '-12.5'`, 'admin reload');
  await saveAdmin('22', 'Ensoleillé', '45'); // restore seed
  await select('#admin-city', 'Lyon');
  assert.equal(await evaluate(`document.querySelector('#temperature').value`), '18');
  await fill('#humidity', '70');
  await click('.form-actions .button-secondary');
  assert.equal(await evaluate(`document.querySelector('#humidity').value`), '60');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.button')).transitionDuration`), '0s');
  // Only the Supabase session token is stored client-side; never a role.
  assert.deepEqual(await evaluate(`Object.keys(localStorage).filter(key => !/^sb-.*-auth-token$/.test(key))`), []);
  await signOut();
  assert.deepEqual(errors, [], 'Browser console must stay clean');
  console.log('PASS: guards, 4 routes x 5 widths, labels, focus, auth errors, Visiteur read/refusal, sign-out, Manager save + persistence after reload.');
  console.log(`Screenshots: ${artifacts}`);
} finally {
  socket?.close();
  chrome.kill();
}
