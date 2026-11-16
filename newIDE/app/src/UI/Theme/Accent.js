// @flow
// VoxForge: выбор цвета акцента. Основная тема нарисована в оранжевом, а при
// выборе другого цвета мы пересчитываем оттенок всех «оранжевых» переменных
// темы (CSS-переменные на <body>), сохраняя яркость и насыщенность.

export type Accent = {|
  id: string,
  /** Русский ключ подписи для vf(). */
  label: string,
  /** Оттенок (0–360). null — оставить как в теме. */
  hue: number | null,
  /** Цвет кружка в выборе. */
  swatch: string,
|};

export const ACCENTS: Array<Accent> = [
  { id: 'orange', label: 'Оранжевый', hue: null, swatch: '#ff8a3d' },
  { id: 'blue', label: 'Синий', hue: 214, swatch: '#3d8bff' },
  { id: 'teal', label: 'Бирюзовый', hue: 175, swatch: '#22c7b2' },
  { id: 'green', label: 'Зелёный', hue: 140, swatch: '#3fcf6e' },
  { id: 'purple', label: 'Фиолетовый', hue: 268, swatch: '#9b6bff' },
  { id: 'pink', label: 'Розовый', hue: 330, swatch: '#ff5fa8' },
  { id: 'red', label: 'Красный', hue: 355, swatch: '#ff4d5e' },
];

const STORAGE_KEY = 'vf-accent';
const CHANGE_EVENT = 'vf-accent-change';
const BASE_HUE = 25; // оттенок оранжевой темы

export const getStoredAccentId = (): string => {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY);
    if (id && ACCENTS.some(accent => accent.id === id)) return id;
  } catch (error) {
    // Хранилище недоступно — остаётся оранжевый.
  }
  return 'orange';
};

export const setStoredAccentId = (id: string) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch (error) {
    // Не страшно: цвет просто не запомнится.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const subscribeToAccentChange = (listener: () => void): (() => void) => {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
};

// --- Цвет ---

const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

/** Оранжевый ли это цвет (тёплый оттенок и заметная насыщенность). */
const isAccentLike = (h: number, s: number, l: number): boolean =>
  h >= 8 && h <= 48 && s >= 0.45 && l >= 0.18 && l <= 0.92;

const shiftColor = (r: number, g: number, b: number, targetHue: number) => {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (!isAccentLike(h, s, l)) return null;
  const newHue = (targetHue + (h - BASE_HUE) * 0.4 + 360) % 360;
  return hslToRgb(newHue, s, l);
};

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

/** Пересчитывает все оранжевые цвета внутри значения CSS-переменной. */
export const recolorValue = (value: string, targetHue: number): string => {
  let changed = false;
  let result = value.replace(
    /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,
    (match, hex) => {
      let full = hex;
      if (hex.length === 3) full = hex.split('').map(c => c + c).join('');
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      const shifted = shiftColor(r, g, b, targetHue);
      if (!shifted) return match;
      changed = true;
      return '#' + shifted.map(hex2).join('') + full.slice(6);
    }
  );
  result = result.replace(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g,
    (match, r, g, b, alpha) => {
      const shifted = shiftColor(+r, +g, +b, targetHue);
      if (!shifted) return match;
      changed = true;
      return alpha
        ? `rgba(${shifted.join(', ')}${alpha})`
        : `rgb(${shifted.join(', ')})`;
    }
  );
  return changed ? result : value;
};

let appliedProperties: Array<string> = [];

/** Собирает переменные темы, объявленные на body / на классе темы. */
const collectThemeVariables = (): { [name: string]: string } => {
  const variables = {};
  const bodyClassName = document.body ? document.body.className : '';
  const sheets = Array.from(document.styleSheets);
  sheets.forEach(sheet => {
    let rules;
    try {
      rules = Array.from(sheet.cssRules);
    } catch (error) {
      return; // Чужой файл стилей — пропускаем.
    }
    rules.forEach(rule => {
      if (!rule.style || !rule.selectorText) return;
      const selector = rule.selectorText;
      const isThemeRule = selector
        .split(',')
        .some(part => {
          const trimmed = part.trim();
          return (
            trimmed === 'body' ||
            trimmed === ':root' ||
            (bodyClassName &&
              bodyClassName
                .split(/\s+/)
                .some(
                  cls =>
                    cls &&
                    (trimmed === '.' + cls || trimmed === 'body.' + cls)
                ))
          );
        });
      if (!isThemeRule) return;
      for (let i = 0; i < rule.style.length; i++) {
        const name = rule.style[i];
        if (name.startsWith('--')) {
          variables[name] = rule.style.getPropertyValue(name).trim();
        }
      }
    });
  });
  return variables;
};

/** Применяет акцент к странице. Вызывать после смены класса темы на body. */
export const applyAccent = (accentId: string) => {
  const { body } = document;
  if (!body) return;
  appliedProperties.forEach(name => body.style.removeProperty(name));
  appliedProperties = [];

  const accent = ACCENTS.find(item => item.id === accentId);
  if (!accent || accent.hue === null) return;
  const hue = accent.hue;

  const variables = collectThemeVariables();
  Object.keys(variables).forEach(name => {
    // Предупреждения и ошибки остаются своих цветов.
    if (/warning|error/.test(name)) return;
    const original = variables[name];
    const recolored = recolorValue(original, hue);
    if (recolored !== original) {
      body.style.setProperty(name, recolored);
      appliedProperties.push(name);
    }
  });
};
