export const DEFAULT_THEME_ID = 'light';

export const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'sepia', label: 'Sepia / Paper' },
  { id: 'solar', label: 'Solar / Warm' },
  { id: 'midnight', label: 'Midnight' },
];

const themeIds = new Set(THEMES.map((theme) => theme.id));

export function isValidThemeId(themeId) {
  return themeIds.has(themeId);
}

export function normalizeThemeId(themeId) {
  return isValidThemeId(themeId) ? themeId : DEFAULT_THEME_ID;
}
