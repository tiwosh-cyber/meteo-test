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
  async function navigate(path) {
    await send('Page.navigate', { url: base + path });
    for (let i = 0; i < 80; i++) {
      if (await evaluate(`location.pathname === ${JSON.stringify(path)} && Boolean(document.querySelector('h1'))`)) return;
      await sleep(100);
    }
    throw new Error(`Route did not render: ${path}`);
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

  for (const route of ['/weather', '/login', '/register', '/admin']) {
    await navigate(route);
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
  await navigate('/weather');
  for (const [city, temperature, condition, humidity] of [['Paris', '22', 'Ensoleillé', '45 %'], ['Lyon', '18', 'Nuageux', '60 %'], ['Marseille', '26', 'Ensoleillé', '35 %']]) {
    await select('#city', city);
    assert.equal(await evaluate(`document.querySelector('.temperature > span').textContent`), temperature);
    assert.equal(await evaluate(`document.querySelector('.condition').textContent`), condition);
    assert.equal(await evaluate(`document.querySelector('.humidity strong').textContent`), humidity);
  }
  await click('.city-card');
  assert.equal(await evaluate(`document.querySelector('#city').value`), 'Paris');
  await click('.preview-states summary');
  for (const status of ['loading', 'error', 'empty']) {
    await select('#preview-state', status);
    assert.equal(await evaluate(`Boolean(document.querySelector('.weather-state'))`), true);
    assert.equal(await evaluate(`document.querySelectorAll('.weather-main .temperature').length`), 0);
    if (status === 'loading') assert.equal(await evaluate(`document.querySelector('.weather-state').getAttribute('aria-busy')`), 'true');
  }
  await select('#preview-state', 'error');
  await click('.weather-state button');
  assert.equal(await evaluate(`Boolean(document.querySelector('.weather-main'))`), true);

  for (const route of ['/login', '/register']) {
    await navigate(route);
    await click('button[type="submit"]');
    assert.equal(await evaluate(`document.querySelectorAll('[aria-invalid="true"]').length`), 2);
    assert.equal(await evaluate(`document.activeElement.id`), 'email');
    await fill('#email', 'test@example.com');
    await fill('#password', 'valid-password');
    await click('.password-toggle');
    assert.equal(await evaluate(`document.querySelector('#password').type`), 'text');
    await click('button[type="submit"]');
    assert.equal(await evaluate(`document.querySelectorAll('[aria-invalid="true"]').length`), 0);
    assert.match(await evaluate(`document.querySelector('form .message').textContent`), /indisponible/);
    assert.equal(await evaluate('location.pathname'), route);
  }

  await navigate('/admin');
  assert.equal(await evaluate(`document.querySelector('.save-unavailable button').disabled`), true);
  await fill('#humidity', '101');
  await click('button[type="submit"]');
  assert.equal(await evaluate(`document.querySelector('#humidity').getAttribute('aria-invalid')`), 'true');
  assert.equal(await evaluate(`document.querySelectorAll('.admin-preview .temperature').length`), 0);
  await fill('#humidity', '50');
  await fill('#temperature', '-12.5');
  await select('#condition', 'Orageux');
  assert.deepEqual(await evaluate(`['temperature','humidity','condition'].map(id => document.getElementById(id).value)`), ['-12.5', '50', 'Orageux']);
  await click('button[type="submit"]');
  assert.match(await evaluate(`document.querySelector('form .message').textContent`), /Aucune donnée n’a été enregistrée/);
  assert.equal(await evaluate(`document.querySelector('.admin-preview .condition').textContent`), 'Orageux');
  await navigate('/weather');
  assert.equal(await evaluate(`document.querySelector('.temperature > span').textContent`), '22');
  await navigate('/admin');
  assert.equal(await evaluate(`document.querySelector('#temperature').value`), '22');
  await select('#admin-city', 'Lyon');
  assert.equal(await evaluate(`document.querySelector('#temperature').value`), '18');
  await fill('#humidity', '70');
  await click('.form-actions .button-secondary');
  assert.equal(await evaluate(`document.querySelector('#humidity').value`), '60');
  await select('#admin-city', 'Marseille');
  assert.equal(await evaluate(`document.querySelector('#temperature').value`), '26');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.button')).transitionDuration`), '0s');
  assert.deepEqual(await evaluate('Object.keys(localStorage)'), []);
  assert.deepEqual(errors, [], 'Browser console must stay clean');
  console.log('PASS: 4 routes, 5 widths, labels, keyboard focus, cities, visual states, auth validation and non-persistent admin.');
  console.log(`Screenshots: ${artifacts}`);
} finally {
  socket?.close();
  chrome.kill();
}
