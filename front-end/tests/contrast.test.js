import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const color = token => css.match(new RegExp(`--color-${token}:\\s*(#[a-f0-9]+)`, 'i'))[1];
function luminance(hex) {
  const expanded = hex.length === 4 ? hex.slice(1).split('').map(value => value + value).join('') : hex.slice(1);
  return expanded.match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

test('Design System: normal text pairs meet WCAG AA contrast (4.5:1)', () => {
  for (const [foreground, background] of [
    [color('navy'), color('page')], [color('muted'), color('white')],
    [color('muted'), '#dcefff'], [color('white'), color('blue')],
    [color('blue'), color('info-bg')], [color('error'), color('error-bg')],
    [color('success'), color('success-bg')],
  ]) {
    const a = luminance(foreground), b = luminance(background);
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}:1`);
  }
});
