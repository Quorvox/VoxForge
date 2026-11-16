// @flow
// VoxForge: проект как настоящая папка с файлами на компьютере.
// Работает через File System Access API (Chrome, Edge и другие на Chromium).
//
//   game.json                        главный файл проекта
//   layouts/<сцена>.json             сцены (события внутри)
//   externalLayouts/…, externalEvents/…, eventsFunctionsExtensions/…
//   README.md                        короткая памятка, как править в VS Code
//
// Формат тот же, что у настольной версии (см. LocalProjectWriter), поэтому
// такую папку можно открыть и там.
import { serializeToJSObject, addFinalNewline } from '../../Utils/Serializer';
import {
  getScriptName,
  slugifyScriptName,
  unwrapPythonCode,
  wrapPythonCode,
} from '../../EventsSheet/PythonEvent';
import {
  split,
  unsplit,
  splitPaths,
  getSlugifiedUniqueNameFromProperty,
} from '../../Utils/ObjectSplitter';

export const MAIN_PROJECT_FILE = 'game.json';
const SPLIT_FOLDER_NAMES = [
  'layouts',
  'externalLayouts',
  'externalEvents',
  'eventsFunctionsExtensions',
];
const REFERENCE_MAGIC_PROPERTY = '__REFERENCE_TO_SPLIT_OBJECT';

export const isFolderStorageSupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.showDirectoryPicker === 'function';

/** Разрешение на запись. Запрос возможен только по клику/нажатию клавиши. */
export const ensureWritePermission = async (handle: any): Promise<void> => {
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') return;
  if ((await handle.requestPermission(options)) === 'granted') return;
  throw new Error(
    'Нет доступа к папке проекта. Разреши доступ и попробуй снова.'
  );
};

const splitPath = (path: string): Array<string> =>
  path.split('/').filter(Boolean);

const getParentDirectory = async (
  root: any,
  segments: Array<string>,
  create: boolean
): Promise<any> => {
  let directory = root;
  for (const segment of segments.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(segment, { create });
  }
  return directory;
};

export const fileExists = async (root: any, path: string): Promise<boolean> => {
  try {
    const segments = splitPath(path);
    const directory = await getParentDirectory(root, segments, false);
    await directory.getFileHandle(segments[segments.length - 1]);
    return true;
  } catch (error) {
    return false;
  }
};

const readTextFile = async (root: any, path: string): Promise<string> => {
  const segments = splitPath(path);
  const directory = await getParentDirectory(root, segments, false);
  const fileHandle = await directory.getFileHandle(
    segments[segments.length - 1]
  );
  return (await fileHandle.getFile()).text();
};

const writeTextFile = async (
  root: any,
  path: string,
  text: string
): Promise<void> => {
  if (text === '') throw new Error('Пустое содержимое файла: запись отменена.');
  const segments = splitPath(path);
  const directory = await getParentDirectory(root, segments, true);
  const fileHandle = await directory.getFileHandle(
    segments[segments.length - 1],
    {
      create: true,
    }
  );
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
};

const writeJsonFile = (root: any, path: string, object: Object) =>
  writeTextFile(root, path, addFinalNewline(JSON.stringify(object, null, 2)));

// --- Скрипты: код из событий «Код JavaScript» и «Код Python» лежит отдельными
// файлами в scripts/, чтобы его удобно править в VS Code. ---
const SCRIPT_FOLDER = 'scripts';
const JS_CODE_EVENT_TYPE = 'BuiltinCommonInstructions::JsCode';
const SCRIPT_SOURCES = ['layouts', 'externalEvents'];

/** В JSON код события лежит строкой или массивом строк (по строке кода). */
const getInlineCodeText = (event: Object): string =>
  Array.isArray(event.inlineCode)
    ? event.inlineCode.join('\n')
    : typeof event.inlineCode === 'string'
    ? event.inlineCode
    : '';

const setInlineCodeText = (event: Object, text: string): void => {
  event.inlineCode = Array.isArray(event.inlineCode)
    ? text.split('\n')
    : text;
};

type ScriptEvent = {| id: string, event: Object |};

/** Все события JS/Python-кода внутри списка событий (вместе с вложенными). */
const collectScriptEvents = (
  events: any,
  prefix: string = ''
): Array<ScriptEvent> => {
  const result = [];
  if (!Array.isArray(events)) return result;
  events.forEach((event, index) => {
    if (!event || typeof event !== 'object') return;
    const id = `${prefix}${index + 1}`;
    if (event.type === JS_CODE_EVENT_TYPE) result.push({ id, event });
    if (Array.isArray(event.events)) {
      result.push(...collectScriptEvents(event.events, `${id}-`));
    }
  });
  return result;
};

const getScriptFolderName = (source: string, slug: string): string =>
  source === 'layouts' ? slug : `${source}-${slug}`;

const getScriptFileName = (id: string, inlineCode: string): string => {
  const python = unwrapPythonCode(inlineCode);
  const text = python !== null ? python : inlineCode;
  const name = getScriptName(text);
  const slug = name ? slugifyScriptName(name) : '';
  return `event-${id}${slug ? `-${slug}` : ''}.${python !== null ? 'py' : 'js'}`;
};

const getScriptText = (inlineCode: string): string => {
  const python = unwrapPythonCode(inlineCode);
  const text = python !== null ? python : inlineCode;
  return text.endsWith('\n') ? text : text + '\n';
};

/** Пишет scripts/…, лишние файлы скриптов удаляет. */
const writeScriptFiles = async (
  root: any,
  partialObjects: Array<{ reference: string, object: Object }>
): Promise<void> => {
  const written = new Set();
  for (const partialObject of partialObjects) {
    const [, source, slug] = partialObject.reference.split('/');
    if (!SCRIPT_SOURCES.includes(source) || !slug) continue;
    for (const { id, event } of collectScriptEvents(
      partialObject.object.events
    )) {
      const inlineCode =
        getInlineCodeText(event);
      const path = `${SCRIPT_FOLDER}/${getScriptFolderName(
        source,
        slug
      )}/${getScriptFileName(id, inlineCode)}`;
      await writeTextFile(root, path, getScriptText(inlineCode));
      written.add(path);
    }
  }

  let scriptsDirectory;
  try {
    scriptsDirectory = await root.getDirectoryHandle(SCRIPT_FOLDER);
  } catch (error) {
    return;
  }
  for await (const [folderName, folder] of scriptsDirectory.entries()) {
    if (folder.kind !== 'directory') continue;
    for await (const [name, entry] of folder.entries()) {
      if (
        entry.kind === 'file' &&
        /^event-\d+(-\d+)*(-[^.]+)?\.(js|py)$/.test(name) &&
        !written.has(`${SCRIPT_FOLDER}/${folderName}/${name}`)
      ) {
        await folder.removeEntry(name);
      }
    }
  }
};

/** Подтягивает код из scripts/… в события, если файл правили вне редактора. */
const readScriptFiles = async (
  root: any,
  project: Object,
  slugsBySource: { [source: string]: Array<string> }
): Promise<void> => {
  for (const source of SCRIPT_SOURCES) {
    const items = project[source];
    const slugs = slugsBySource[source] || [];
    if (!Array.isArray(items)) continue;
    for (let i = 0; i < items.length; i++) {
      const slug = slugs[i];
      if (!slug || !items[i]) continue;
      for (const { id, event } of collectScriptEvents(items[i].events)) {
        const currentCode =
          getInlineCodeText(event);
        const extension = unwrapPythonCode(currentCode) !== null ? 'py' : 'js';
        const folderName = getScriptFolderName(source, slug);
        const path = `${SCRIPT_FOLDER}/${folderName}/${getScriptFileName(
          id,
          currentCode
        )}`;
        if (!(await fileExists(root, path))) continue;
        const fileText = await readTextFile(root, path);
        if (fileText.trimEnd() === getScriptText(currentCode).trimEnd())
          continue;
        const newCode = fileText.replace(/\r\n/g, '\n');
        setInlineCodeText(
          event,
          extension === 'py' ? wrapPythonCode(newCode) : newCode
        );
      }
    }
  }
};

const README_TEXT = `# Проект VoxForge

Это папка проекта. Её можно открыть в VS Code и править файлы:

- \`game.json\` — главный файл проекта (настройки, список сцен);
- \`layouts/\` — сцены, в каждой объекты и события;
- \`externalLayouts/\`, \`externalEvents/\`, \`eventsFunctionsExtensions/\` — внешние сцены, события и расширения;
- \`scripts/<сцена>/event-N.py\` и \`event-N.js\` — код из событий «Код Python» и «Код JavaScript». Правь их в VS Code: при открытии проекта изменения подтянутся в события.

Как работать:

1. Закрой проект в VoxForge (или сначала сохрани его: Ctrl+S).
2. Правь файлы в VS Code и сохраняй.
3. В VoxForge открой эту папку заново: «Открыть проект» → «Папка на компьютере».

Не переименовывай файлы, на которые ссылается \`game.json\`, и следи, чтобы JSON оставался корректным.
`;

/** Записывает проект в папку. Лишние файлы сцен, которых больше нет, убирает. */
export const writeProjectToFolder = async (
  project: gdProject,
  root: any
): Promise<void> => {
  await ensureWritePermission(root);

  const serialized = serializeToJSObject(project);
  const partialObjects = split(serialized, {
    pathSeparator: '/',
    getArrayItemReferenceName: getSlugifiedUniqueNameFromProperty('name'),
    shouldSplit: splitPaths(
      new Set(SPLIT_FOLDER_NAMES.map(name => `/${name}/*`))
    ),
    isReferenceMagicPropertyName: REFERENCE_MAGIC_PROPERTY,
  });

  const writtenPaths = new Set();
  for (const partialObject of partialObjects) {
    const path = `${partialObject.reference.replace(/^\/+/, '')}.json`;
    await writeJsonFile(root, path, partialObject.object);
    writtenPaths.add(path);
  }
  // Главный файл пишем последним: если запись оборвётся раньше, прежний
  // game.json останется целым и ссылается на старые файлы.
  await writeJsonFile(root, MAIN_PROJECT_FILE, serialized);
  await writeScriptFiles(root, partialObjects);

  // Убираем файлы удалённых сцен и событий (только .json в служебных папках).
  for (const folderName of SPLIT_FOLDER_NAMES) {
    let directory;
    try {
      directory = await root.getDirectoryHandle(folderName);
    } catch (error) {
      continue;
    }
    for await (const [name, entry] of directory.entries()) {
      if (
        entry.kind === 'file' &&
        name.endsWith('.json') &&
        !writtenPaths.has(`${folderName}/${name}`)
      ) {
        await directory.removeEntry(name);
      }
    }
  }

  if (!(await fileExists(root, 'README.md'))) {
    await writeTextFile(root, 'README.md', README_TEXT);
  }
};

/** Читает проект из папки и собирает его обратно из файлов. */
export const readProjectFromFolder = async (root: any): Promise<Object> => {
  let mainText;
  try {
    mainText = await readTextFile(root, MAIN_PROJECT_FILE);
  } catch (error) {
    throw new Error(
      `В этой папке нет файла ${MAIN_PROJECT_FILE}. Выбери папку проекта VoxForge.`
    );
  }
  const project = JSON.parse(mainText);
  // Запоминаем имена файлов сцен до раскрытия ссылок: по ним найдём scripts/…
  const slugsBySource = {};
  for (const source of SCRIPT_SOURCES) {
    slugsBySource[source] = Array.isArray(project[source])
      ? project[source].map(item =>
          item && typeof item.referenceTo === 'string'
            ? item.referenceTo.split('/').pop()
            : ''
        )
      : [];
  }
  await unsplit(project, {
    isReferenceMagicPropertyName: REFERENCE_MAGIC_PROPERTY,
    getReferencePartialObject: async (referencePath: string) =>
      JSON.parse(
        await readTextFile(root, `${referencePath.replace(/^\/+/, '')}.json`)
      ),
    // Как в настольной версии: раскрываем ссылки до сцен, внешних сцен и событий.
    maxUnsplitDepth: 3,
  });
  await readScriptFiles(root, project, slugsBySource);
  return project;
};
