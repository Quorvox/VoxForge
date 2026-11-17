// @flow
// VoxForge: язык microScript для редактора Код-игры: подсветка, подсказки
// (автодополнение и описания при наведении), структура файла и проверка `end`.

export const LANGUAGE_ID = 'microscript';
export const THEME_ID = 'voxforge-ms';

const KEYWORDS = [
  'if',
  'then',
  'else',
  'elsif',
  'end',
  'for',
  'in',
  'to',
  'by',
  'while',
  'do',
  'return',
  'break',
  'continue',
  'function',
  'object',
  'class',
  'extends',
  'new',
  'local',
  'and',
  'or',
  'not',
];

const CONSTANTS = ['true', 'false', 'null', 'this', 'super'];

type Member = {| name: string, sig: string, doc: string, isMethod: boolean |};

const m = (name: string, sig: string, doc: string): Member => ({
  name,
  sig,
  doc,
  isMethod: true,
});
const p = (name: string, doc: string): Member => ({
  name,
  sig: name,
  doc,
  isMethod: false,
});

const API: { [namespace: string]: Array<Member> } = {
  screen: [
    p('width', 'Ширина экрана в условных пикселях.'),
    p('height', 'Высота экрана в условных пикселях.'),
    m('clear', 'clear(color)', 'Залить весь экран цветом. Без цвета очищает.'),
    m('setColor', 'setColor(color)', 'Цвет по умолчанию для рисования.'),
    m('setAlpha', 'setAlpha(alpha)', 'Прозрачность рисования, от 0 до 1.'),
    m('setPixelated', 'setPixelated(bool)', 'Рисовать пиксели без сглаживания.'),
    m('setBlending', 'setBlending(mode)', 'Режим наложения: "normal" или "additive".'),
    m(
      'setLinearGradient',
      'setLinearGradient(x1, y1, x2, y2, color1, color2)',
      'Линейный градиент как цвет заливки.'
    ),
    m(
      'setRadialGradient',
      'setRadialGradient(x, y, radius, color1, color2)',
      'Круговой градиент как цвет заливки.'
    ),
    m('setFont', 'setFont(font)', 'Выбрать шрифт для drawText.'),
    m('setTranslation', 'setTranslation(tx, ty)', 'Сдвинуть начало координат.'),
    m('setScale', 'setScale(x, y)', 'Масштаб рисования.'),
    m('setRotation', 'setRotation(angle)', 'Поворот всего рисования, в градусах.'),
    m('setDrawAnchor', 'setDrawAnchor(ax, ay)', 'Точка привязки рисуемых объектов.'),
    m('setDrawRotation', 'setDrawRotation(angle)', 'Поворот рисуемых объектов.'),
    m('setDrawScale', 'setDrawScale(x, y)', 'Масштаб рисуемых объектов.'),
    m('fillRect', 'fillRect(x, y, width, height, color)', 'Закрашенный прямоугольник.'),
    m(
      'fillRoundRect',
      'fillRoundRect(x, y, width, height, radius, color)',
      'Закрашенный прямоугольник со скруглёнными углами.'
    ),
    m('fillRound', 'fillRound(x, y, width, height, color)', 'Закрашенный эллипс.'),
    m('drawRect', 'drawRect(x, y, width, height, color)', 'Контур прямоугольника.'),
    m(
      'drawRoundRect',
      'drawRoundRect(x, y, width, height, radius, color)',
      'Контур прямоугольника со скруглёнными углами.'
    ),
    m('drawRound', 'drawRound(x, y, width, height, color)', 'Контур эллипса.'),
    m(
      'drawSprite',
      'drawSprite(sprite, x, y, width, height)',
      'Нарисовать спрайт по имени. Высота необязательна.'
    ),
    m('drawImage', 'drawImage(sprite, x, y, width, height)', 'То же, что drawSprite.'),
    m(
      'drawSpritePart',
      'drawSpritePart(sprite, sx, sy, sw, sh, x, y, width, height)',
      'Нарисовать часть спрайта.'
    ),
    m('drawMap', 'drawMap(map, x, y, width, height)', 'Нарисовать карту по имени.'),
    m('drawText', 'drawText(text, x, y, size, color)', 'Вывести текст.'),
    m('textWidth', 'textWidth(text, size)', 'Ширина текста при таком размере.'),
    m('setLineWidth', 'setLineWidth(width)', 'Толщина линий.'),
    m('setLineDash', 'setLineDash(dash)', 'Пунктир: список длин штриха и пробела.'),
    m('drawLine', 'drawLine(x1, y1, x2, y2, color)', 'Линия.'),
    m('drawPolygon', 'drawPolygon(x1, y1, x2, y2, …)', 'Контур многоугольника.'),
    m('drawPolyline', 'drawPolyline(x1, y1, x2, y2, …)', 'Ломаная линия.'),
    m('fillPolygon', 'fillPolygon(x1, y1, x2, y2, …)', 'Закрашенный многоугольник.'),
    m('drawQuadCurve', 'drawQuadCurve(x1, y1, xc, yc, x2, y2)', 'Кривая Безье.'),
    m(
      'drawArc',
      'drawArc(x, y, radius, angle1, angle2, ccw, color)',
      'Контур дуги.'
    ),
    m(
      'fillArc',
      'fillArc(x, y, radius, angle1, angle2, ccw, color)',
      'Закрашенный сектор.'
    ),
    m('setCursorVisible', 'setCursorVisible(bool)', 'Показать или спрятать курсор мыши.'),
  ],
  audio: [
    m('beep', 'beep(sequence)', 'Короткий звуковой сигнал из строки нот.'),
    m(
      'playSound',
      'playSound(sound, volume, pitch, pan, loop)',
      'Проиграть звук по имени. Всё, кроме имени, необязательно.'
    ),
    m(
      'playMusic',
      'playMusic(music, volume, loop)',
      'Включить музыку по имени.'
    ),
  ],
  keyboard: [
    p('press', 'Таблица: keyboard.press.SPACE истинна в кадре нажатия.'),
    p('release', 'Таблица: keyboard.release.SPACE истинна в кадре отпускания.'),
    p('UP', 'Стрелка вверх зажата.'),
    p('DOWN', 'Стрелка вниз зажата.'),
    p('LEFT', 'Стрелка влево зажата.'),
    p('RIGHT', 'Стрелка вправо зажата.'),
    p('SPACE', 'Пробел зажат.'),
    p('ENTER', 'Enter зажат.'),
    p('ESCAPE', 'Esc зажат.'),
    p('SHIFT', 'Shift зажат.'),
  ],
  mouse: [
    p('x', 'Положение курсора по X.'),
    p('y', 'Положение курсора по Y.'),
    p('pressed', 'Любая кнопка мыши зажата.'),
    p('left', 'Левая кнопка зажата.'),
    p('right', 'Правая кнопка зажата.'),
    p('middle', 'Средняя кнопка зажата.'),
  ],
  touch: [
    p('touching', 'Есть касание экрана.'),
    p('x', 'Положение касания по X.'),
    p('y', 'Положение касания по Y.'),
    p('press', 'Касание началось в этом кадре.'),
    p('release', 'Касание закончилось в этом кадре.'),
  ],
  gamepad: [
    p('UP', 'Крестовина вверх.'),
    p('DOWN', 'Крестовина вниз.'),
    p('LEFT', 'Крестовина влево.'),
    p('RIGHT', 'Крестовина вправо.'),
    p('A', 'Кнопка A.'),
    p('B', 'Кнопка B.'),
    p('X', 'Кнопка X.'),
    p('Y', 'Кнопка Y.'),
  ],
  system: [
    p('time', 'Текущее время в миллисекундах.'),
    p('language', 'Язык устройства, например "ru-RU".'),
    p('inputs', 'Какие устройства ввода доступны.'),
    m('exit', 'exit()', 'Закрыть игру.'),
    m('pause', 'pause()', 'Поставить игру на паузу.'),
  ],
  storage: [
    m('set', 'set(name, value)', 'Сохранить значение в память игры.'),
    m('get', 'get(name)', 'Прочитать сохранённое значение.'),
  ],
  Math: [
    p('PI', 'Число пи.'),
    m('sin', 'sin(x)', 'Синус.'),
    m('cos', 'cos(x)', 'Косинус.'),
    m('tan', 'tan(x)', 'Тангенс.'),
    m('atan2', 'atan2(y, x)', 'Угол вектора.'),
    m('sqrt', 'sqrt(x)', 'Квадратный корень.'),
    m('abs', 'abs(x)', 'Модуль числа.'),
    m('min', 'min(a, b)', 'Меньшее из двух.'),
    m('max', 'max(a, b)', 'Большее из двух.'),
    m('floor', 'floor(x)', 'Округление вниз.'),
    m('ceil', 'ceil(x)', 'Округление вверх.'),
    m('round', 'round(x)', 'Округление до ближайшего.'),
    m('random', 'random()', 'Случайное число от 0 до 1.'),
  ],
};

const GLOBALS: Array<{| name: string, doc: string |}> = [
  { name: 'print', doc: 'print(value): вывести значение в консоль.' },
  { name: 'screen', doc: 'Рисование на экране.' },
  { name: 'audio', doc: 'Звуки и музыка.' },
  { name: 'keyboard', doc: 'Клавиатура.' },
  { name: 'mouse', doc: 'Мышь.' },
  { name: 'touch', doc: 'Касания экрана.' },
  { name: 'gamepad', doc: 'Геймпад.' },
  { name: 'system', doc: 'Система: время, язык, выход.' },
  { name: 'storage', doc: 'Сохранение данных игры.' },
  { name: 'Math', doc: 'Математика.' },
  { name: 'sprites', doc: 'Спрайты игры.' },
  { name: 'sounds', doc: 'Звуки игры.' },
  { name: 'music', doc: 'Музыка игры.' },
  { name: 'maps', doc: 'Карты игры.' },
];

const SNIPPETS: Array<{| label: string, body: string, doc: string |}> = [
  {
    label: 'init',
    body: 'init = function()\n\t$0\nend',
    doc: 'Вызывается один раз при старте игры.',
  },
  {
    label: 'update',
    body: 'update = function()\n\t$0\nend',
    doc: 'Вызывается 60 раз в секунду: логика игры.',
  },
  {
    label: 'draw',
    body: 'draw = function()\n\tscreen.clear()\n\t$0\nend',
    doc: 'Вызывается каждый кадр: рисование.',
  },
  { label: 'if', body: 'if ${1:условие} then\n\t$0\nend', doc: 'Условие.' },
  {
    label: 'ifelse',
    body: 'if ${1:условие} then\n\t$2\nelse\n\t$0\nend',
    doc: 'Условие с else.',
  },
  {
    label: 'for',
    body: 'for ${1:i} = ${2:0} to ${3:10}\n\t$0\nend',
    doc: 'Цикл по числам.',
  },
  {
    label: 'forin',
    body: 'for ${1:item} in ${2:list}\n\t$0\nend',
    doc: 'Цикл по списку.',
  },
  {
    label: 'while',
    body: 'while ${1:условие}\n\t$0\nend',
    doc: 'Цикл с условием.',
  },
  {
    label: 'function',
    body: '${1:name} = function(${2})\n\t$0\nend',
    doc: 'Новая функция.',
  },
  {
    label: 'object',
    body: '${1:name} = object\n\t$0\nend',
    doc: 'Новый объект.',
  },
  {
    label: 'class',
    body: 'class ${1:Name}\n\tconstructor = function(${2})\n\t\t$0\n\tend\nend',
    doc: 'Новый класс.',
  },
];

export type AssetNames = {|
  sprites: Array<string>,
  sounds: Array<string>,
  music: Array<string>,
  maps: Array<string>,
|};

let assetNames: AssetNames = { sprites: [], sounds: [], music: [], maps: [] };
export const setAssetNames = (names: AssetNames) => {
  assetNames = names;
};

let registered = false;

export const registerMicroScript = (monaco: any) => {
  if (registered) return;
  registered = true;

  monaco.languages.register({ id: LANGUAGE_ID });
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, {
    comments: { lineComment: '//' },
    brackets: [['(', ')'], ['[', ']'], ['{', '}']],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '"', close: '"', notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '"', close: '"' },
    ],
    indentationRules: {
      increaseIndentPattern: /^\s*(.*\b(then|do)\s*$|(if|for|while|else|elsif|function|object|class)\b.*|.*=\s*(function|object)\b.*)$/,
      decreaseIndentPattern: /^\s*(end|else|elsif)\b/,
    },
    onEnterRules: [],
  });

  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    keywords: KEYWORDS,
    constants: CONSTANTS,
    namespaces: GLOBALS.map(item => item.name),
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\d+\.?\d*(e[+-]?\d+)?/, 'number'],
        [/\b(init|update|draw)\b(?=\s*=)/, 'type.identifier'],
        [
          /[A-Za-z_][A-Za-z0-9_]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@constants': 'constant',
              '@namespaces': 'predefined',
              '[A-Z]\\w*': 'type.identifier',
              '@default': 'identifier',
            },
          },
        ],
        [/[+\-*/%<>=!&|^~]+/, 'operator'],
        [/[()[\]{}]/, '@brackets'],
        [/[,.;:]/, 'delimiter'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  });

  monaco.editor.defineTheme(THEME_ID, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6f6558', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff8a3d' },
      { token: 'constant', foreground: 'c792ea' },
      { token: 'predefined', foreground: '5ec4d4' },
      { token: 'type.identifier', foreground: 'ffcb6b' },
      { token: 'string', foreground: 'a6d189' },
      { token: 'string.escape', foreground: '81c8be' },
      { token: 'number', foreground: 'f2a07a' },
      { token: 'operator', foreground: 'd6c8b8' },
      { token: 'identifier', foreground: 'f4ede5' },
    ],
    colors: {
      'editor.background': '#0d0b09',
      'editor.foreground': '#f4ede5',
      'editorLineNumber.foreground': '#4a4036',
      'editorLineNumber.activeForeground': '#b9a999',
      'editor.lineHighlightBackground': '#16120e',
      'editor.selectionBackground': '#5a3a1f',
      'editor.inactiveSelectionBackground': '#33261a',
      'editorCursor.foreground': '#ff8a3d',
      'editorIndentGuide.background': '#201a14',
      'editorIndentGuide.activeBackground': '#3a2f24',
      'editorWidget.background': '#14110e',
      'editorSuggestWidget.background': '#14110e',
      'editorSuggestWidget.border': '#2a2118',
      'editorSuggestWidget.selectedBackground': '#2a1d12',
      'editorHoverWidget.background': '#14110e',
      'editorHoverWidget.border': '#2a2118',
      'scrollbarSlider.background': '#ffffff16',
      'scrollbarSlider.hoverBackground': '#ffffff26',
    },
  });

  const toMarkdown = (item: Member) =>
    `\`${item.sig}\`\n\n${item.doc}`;

  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    triggerCharacters: ['.', '"'],
    provideCompletionItems: (model: any, position: any) => {
      const before = model
        .getLineContent(position.lineNumber)
        .slice(0, position.column - 1);
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const kinds = monaco.languages.CompletionItemKind;

      // Внутри строки: имена спрайтов, звуков, музыки и карт.
      const quotes = (before.match(/"/g) || []).length;
      if (quotes % 2 === 1) {
        let names: Array<string> = [];
        if (/(drawSprite|drawImage|drawSpritePart)\(\s*"[^"]*$/.test(before))
          names = assetNames.sprites;
        else if (/playSound\(\s*"[^"]*$/.test(before)) names = assetNames.sounds;
        else if (/playMusic\(\s*"[^"]*$/.test(before)) names = assetNames.music;
        else if (/drawMap\(\s*"[^"]*$/.test(before)) names = assetNames.maps;
        return names.map(name => ({
          label: name,
          kind: kinds.File,
          insertText: name,
          range,
        }));
      }

      const memberMatch = /([A-Za-z_][A-Za-z0-9_]*)\.\w*$/.exec(before);
      if (memberMatch) {
        const members = API[memberMatch[1]];
        if (!members) return [];
        return members.map(item => ({
          label: item.name,
          kind: item.isMethod ? kinds.Method : kinds.Property,
          detail: item.sig,
          documentation: { value: item.doc },
          insertText: item.isMethod
            ? item.name + (item.sig.endsWith('()') ? '()' : '(')
            : item.name,
          range,
        }));
      }

      const suggestions = [];
      SNIPPETS.forEach(snippet =>
        suggestions.push({
          label: snippet.label,
          kind: kinds.Snippet,
          insertText: { value: snippet.body },
          documentation: { value: snippet.doc },
          range,
        })
      );
      GLOBALS.forEach(item =>
        suggestions.push({
          label: item.name,
          kind: kinds.Module,
          documentation: { value: item.doc },
          insertText: item.name,
          range,
        })
      );
      KEYWORDS.concat(CONSTANTS).forEach(keyword =>
        suggestions.push({
          label: keyword,
          kind: kinds.Keyword,
          insertText: keyword,
          range,
        })
      );
      return suggestions;
    },
  });

  monaco.languages.registerHoverProvider(LANGUAGE_ID, {
    provideHover: (model: any, position: any) => {
      const line = model.getLineContent(position.lineNumber);
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const before = line.slice(0, word.startColumn - 1);
      const member = /([A-Za-z_][A-Za-z0-9_]*)\.$/.exec(before);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      if (member && API[member[1]]) {
        const item = API[member[1]].find(entry => entry.name === word.word);
        if (item) {
          return {
            range,
            contents: [{ value: toMarkdown({ ...item, sig: `${member[1]}.${item.sig}` }) }],
          };
        }
      }
      const global = GLOBALS.find(entry => entry.name === word.word);
      if (global) return { range, contents: [{ value: global.doc }] };
      return null;
    },
  });
};

// Убираем строки и комментарии, чтобы слова в них не считались кодом.
const stripNoise = (line: string): string =>
  line.replace(/"([^"\\]|\\.)*"/g, '""').replace(/\/\/.*$/, '');

export type OutlineItem = {|
  name: string,
  line: number,
  kind: 'function' | 'object' | 'class' | 'variable',
  depth: number,
|};

/** Структура файла: функции, объекты, классы и их вложенные методы. */
export const getOutline = (text: string): Array<OutlineItem> => {
  const items = [];
  let depth = 0;
  text.split('\n').forEach((raw, index) => {
    const line = stripNoise(raw);
    const trimmed = line.trim();
    if (!trimmed) return;
    let kind: ?('function' | 'object' | 'class') = null;
    let name = '';
    let match = /^([A-Za-z_]\w*)\s*=\s*function\b/.exec(trimmed);
    if (match) {
      kind = 'function';
      name = match[1];
    } else if ((match = /^([A-Za-z_]\w*)\s*=\s*object\b/.exec(trimmed))) {
      kind = 'object';
      name = match[1];
    } else if ((match = /^class\s+([A-Za-z_]\w*)/.exec(trimmed))) {
      kind = 'class';
      name = match[1];
    }
    if (kind && depth <= 2) {
      items.push({ name, line: index + 1, kind, depth });
    }
    const opens = (trimmed.match(/\b(if|for|while|function|object|class)\b/g) || [])
      .length;
    const closes = (trimmed.match(/\bend\b/g) || []).length;
    depth = Math.max(0, depth + opens - closes);
  });
  return items;
};

export type LintProblem = {|
  line: number,
  message: string,
|};

/** Простая проверка: число `end` должно совпадать с числом блоков. */
export const lintMicroScript = (text: string): Array<LintProblem> => {
  let balance = 0;
  const stack: Array<number> = [];
  const problems = [];
  text.split('\n').forEach((raw, index) => {
    const line = stripNoise(raw);
    const tokens = line.match(/\b(if|for|while|function|object|class|end)\b/g) || [];
    tokens.forEach(token => {
      if (token === 'end') {
        balance -= 1;
        if (stack.length) stack.pop();
        else problems.push({ line: index + 1, message: 'Лишний end: у него нет начала блока.' });
      } else {
        balance += 1;
        stack.push(index + 1);
      }
    });
  });
  if (balance > 0) {
    stack.slice(-balance).forEach(line =>
      problems.push({ line, message: 'Блок открыт, но не закрыт: не хватает end.' })
    );
  }
  return problems;
};
