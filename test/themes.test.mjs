import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_THEME_ID, THEMES, isValidThemeId, normalizeThemeId } from '../app/frontend/src/utils/themes.js';

test('theme catalog includes a valid default and unique theme IDs', () => {
  const themeIds = THEMES.map((theme) => theme.id);

  assert.equal(isValidThemeId(DEFAULT_THEME_ID), true);
  assert.equal(new Set(themeIds).size, themeIds.length);
});

test('theme catalog includes the expected writing themes', () => {
  assert.deepEqual(THEMES.map((theme) => theme.id), [
    'light',
    'dark',
    'sepia',
    'solar',
    'midnight',
  ]);
});

test('normalizeThemeId falls back to the default for unknown IDs', () => {
  assert.equal(normalizeThemeId('sepia'), 'sepia');
  assert.equal(normalizeThemeId('unknown'), DEFAULT_THEME_ID);
  assert.equal(normalizeThemeId(null), DEFAULT_THEME_ID);
});
