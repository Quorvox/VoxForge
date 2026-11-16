// @flow
// VoxForge: событие «Код Python». Внутри это обычное событие JavaScript-кода,
// в котором Python-текст лежит в строке и запускается через gdjs.python.run.
// Редактор показывает только Python, а обёртку прячет.

export const PYTHON_EVENT_TYPE = 'VoxForge::PythonCode';

const HEADER = '//@python\ngdjs.python.run(runtimeScene, `';
const FOOTER = '`);';

// В шаблонной строке JS экранируем обратную косую, обратный апостроф и ${.
const escapeForTemplate = (code: string): string =>
  code
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

const unescapeFromTemplate = (text: string): string =>
  text.replace(/\\([\\`$])/g, '$1');

export const wrapPythonCode = (code: string): string =>
  HEADER + escapeForTemplate(code) + FOOTER;

/** Python-текст, если это событие Python, иначе null. */
export const unwrapPythonCode = (inlineCode: string): string | null => {
  const text = inlineCode.replace(/\r\n/g, '\n').trimEnd();
  if (!text.startsWith(HEADER) || !text.endsWith(FOOTER)) return null;
  return unescapeFromTemplate(
    text.slice(HEADER.length, text.length - FOOTER.length)
  );
};

export const PYTHON_EVENT_TEMPLATE: string = wrapPythonCode(
  '# Python: доступны scene, game и objects("Имя")\n' +
    'for obj in objects("Player"):\n' +
    '    obj.setX(obj.getX() + 1)\n'
);

// --- Имя скрипта: первая строка кода вида «# name: Имя» (Python) или
// «// name: Имя» (JavaScript). Имя видно в режиме кода и в названии файла.
const NAME_LINE = /^\s*(?:#|\/\/)\s*name:\s*(.+?)\s*$/;

export const getScriptName = (code: string): string | null => {
  const firstLine = code.replace(/\r\n/g, '\n').split('\n')[0] || '';
  const match = NAME_LINE.exec(firstLine);
  return match ? match[1] : null;
};

export const setScriptName = (
  code: string,
  name: string,
  isPython: boolean
): string => {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const prefix = isPython ? '# name: ' : '// name: ';
  const rest = NAME_LINE.test(lines[0] || '') ? lines.slice(1) : lines;
  return name ? [prefix + name, ...rest].join('\n') : rest.join('\n');
};

/** Имя для файла: буквы, цифры, дефис и подчёркивание. */
export const slugifyScriptName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 60);
