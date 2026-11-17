// @flow
// VoxForge: «Код-игра». Открывает готовую игру microStudio (папка с
// index.html): достаёт из неё исходники microScript, сохраняет правки обратно
// и запускает игру через service worker редактора.
import optionalRequire from '../Utils/OptionalRequire';
import {
  getBrowserSWPreviewBaseUrl,
  getBrowserSWPreviewRootUrl,
  putFile,
  ensureBrowserSWPreviewSession,
} from '../ExportAndShare/BrowserExporters/BrowserSWPreviewLauncher/BrowserSWPreviewIndexedDB';
import {
  loadDirectoryHandle,
  saveDirectoryHandle,
} from '../ProjectsStorage/BrowserStorageProvider/BrowserProjectDatabase';

const electron = optionalRequire('electron');
const nodeFs = optionalRequire('fs');
const nodePath = optionalRequire('path');
const nodeHttp = optionalRequire('http');

/** Папка игры: в браузере — handle (File System Access), в приложении — путь. */
export const isDesktopApp = (): boolean => !!electron;

export const pickGameFolderDesktop = async (
  title?: string = 'Папка игры microStudio'
): Promise<?{|
  desktopPath: string,
|}> => {
  const remote = optionalRequire('@electron/remote');
  if (!remote) throw new Error('Не удалось открыть окно выбора папки.');
  const result = await remote.dialog.showOpenDialog({
    title,
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return { desktopPath: result.filePaths[0] };
};

export type CodeFile = {| name: string, text: string, original: string |};

export type CodeGame = {|
  title: string,
  files: Array<CodeFile>,
  /** index.html целиком. */
  html: string,
|};

const CODE_BLOCK = /(<script id="code" type="text\/x-microscript">)([\s\S]*?)(<\/script>)/;
const FILE_HEADER = /^\/\/ file: (.+)$/gm;
const WRAP_START = 'function()\n';
const WRAP_END = '\nend()';

const unwrap = (block: string): string => {
  let text = block.replace(/\r\n/g, '\n');
  // Блок: «// file: имя», «function()», код, «end()» и пустые строки.
  text = text.replace(/^\/\/ file: .+\n/, '');
  if (text.startsWith(WRAP_START)) text = text.slice(WRAP_START.length);
  text = text.replace(/\n*$/, '');
  if (text.endsWith(WRAP_END)) text = text.slice(0, -WRAP_END.length);
  return text;
};

/** Разбирает index.html и возвращает исходники файлов .ms. */
export const parseCodeGame = (html: string): CodeGame => {
  const match = CODE_BLOCK.exec(html);
  if (!match) {
    throw new Error(
      'В этой папке нет игры microStudio: не нашёл блок с исходным кодом в index.html.'
    );
  }
  const code = match[2];
  const headers = [];
  let header;
  FILE_HEADER.lastIndex = 0;
  while ((header = FILE_HEADER.exec(code))) {
    headers.push({ name: header[1], start: header.index });
  }
  const files = headers.map((item, index) => {
    const end =
      index + 1 < headers.length ? headers[index + 1].start : code.length;
    const text = unwrap(code.slice(item.start, end));
    return { name: item.name, text, original: text };
  });
  const titleMatch = /<title>([^<]*)<\/title>/.exec(html);
  return { title: titleMatch ? titleMatch[1] : 'Код-игра', files, html };
};

/** Собирает index.html обратно с текущими правками. */
export const buildCodeGameHtml = (game: CodeGame): string => {
  const body =
    '\n\n\n' +
    game.files
      .map(
        file =>
          `// file: ${file.name}\n${WRAP_START}${file.text}${WRAP_END}\n\n\n\n`
      )
      .join('');
  return game.html.replace(
    CODE_BLOCK,
    (_all, open, _old, close) => open + body + close
  );
};

const CONTENT_TYPES: { [extension: string]: string } = {
  html: 'text/html',
  js: 'application/javascript',
  css: 'text/css',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  md: 'text/markdown',
};

const getContentType = (name: string): string => {
  const extension = (name.split('.').pop() || '').toLowerCase();
  return CONTENT_TYPES[extension] || 'application/octet-stream';
};

const collectFiles = async (
  directory: any,
  prefix: string,
  result: Array<{ path: string, handle: any }>
) => {
  for await (const [name, handle] of directory.entries()) {
    if (handle.kind === 'directory') {
      await collectFiles(handle, `${prefix}${name}/`, result);
    } else {
      result.push({ path: `${prefix}${name}`, handle });
    }
  }
};

/**
 * Кладёт файлы игры в хранилище service worker и возвращает адрес запуска.
 * Вместо index.html из папки используется собранный из правленых исходников.
 */
let desktopServer: any = null;

/** Приложение: маленький локальный сервер отдаёт папку игры с правленым index.html. */
const serveFolderDesktop = (root: string, html: string): Promise<string> =>
  new Promise((resolve, reject) => {
    if (desktopServer) {
      try {
        desktopServer.close();
      } catch (error) {
        // уже закрыт
      }
    }
    desktopServer = nodeHttp.createServer((request, response) => {
      const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
      if (urlPath === '/' || urlPath === '/index.html') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html);
        return;
      }
      const file = nodePath.join(root, urlPath);
      if (
        !file.startsWith(root) ||
        !nodeFs.existsSync(file) ||
        nodeFs.statSync(file).isDirectory()
      ) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(200, { 'Content-Type': getContentType(file) });
      nodeFs.createReadStream(file).pipe(response);
    });
    desktopServer.on('error', reject);
    desktopServer.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${desktopServer.address().port}/`);
    });
  });

export const stageCodeGameForRun = async (
  directoryHandle: any,
  html: string
): Promise<string> => {
  if (directoryHandle.desktopPath) {
    return serveFolderDesktop(directoryHandle.desktopPath, html);
  }
  await ensureBrowserSWPreviewSession();
  const base = getBrowserSWPreviewBaseUrl();
  const rootUrl = getBrowserSWPreviewRootUrl();
  const keyPrefix = `${base.slice(rootUrl.length)}/codegame/`;

  const files = [];
  await collectFiles(directoryHandle, '', files);
  for (const { path, handle } of files) {
    if (path === 'index.html') continue;
    const file = await handle.getFile();
    await putFile(
      `${keyPrefix}${path}`,
      await file.arrayBuffer(),
      getContentType(path)
    );
  }
  await putFile(
    `${keyPrefix}index.html`,
    new TextEncoder().encode(html).buffer,
    'text/html'
  );
  return `${base}/codegame/index.html`;
};

export const readIndexHtml = async (directoryHandle: any): Promise<string> => {
  if (directoryHandle.desktopPath) {
    const file = nodePath.join(directoryHandle.desktopPath, 'index.html');
    if (!nodeFs.existsSync(file)) {
      throw new Error(
        'В этой папке нет index.html. Выбери папку игры microStudio.'
      );
    }
    return nodeFs.readFileSync(file, 'utf8');
  }
  let fileHandle;
  try {
    fileHandle = await directoryHandle.getFileHandle('index.html');
  } catch (error) {
    throw new Error(
      'В этой папке нет index.html. Выбери папку игры microStudio.'
    );
  }
  return (await fileHandle.getFile()).text();
};

/** Записывает index.html. Перед первой записью делает копию index.html.original. */
export const writeIndexHtml = async (
  directoryHandle: any,
  html: string
): Promise<void> => {
  if (directoryHandle.desktopPath) {
    const file = nodePath.join(directoryHandle.desktopPath, 'index.html');
    const backup = nodePath.join(
      directoryHandle.desktopPath,
      'index.html.original'
    );
    if (!nodeFs.existsSync(backup)) nodeFs.copyFileSync(file, backup);
    nodeFs.writeFileSync(file, html, 'utf8');
    return;
  }
  const permission = { mode: 'readwrite' };
  if ((await directoryHandle.queryPermission(permission)) !== 'granted') {
    if ((await directoryHandle.requestPermission(permission)) !== 'granted') {
      throw new Error('Нет разрешения на запись в папку игры.');
    }
  }
  try {
    await directoryHandle.getFileHandle('index.html.original');
  } catch (error) {
    const previous = await readIndexHtml(directoryHandle);
    const backup = await directoryHandle.getFileHandle('index.html.original', {
      create: true,
    });
    const backupWritable = await backup.createWritable();
    await backupWritable.write(previous);
    await backupWritable.close();
  }
  const fileHandle = await directoryHandle.getFileHandle('index.html', {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(html);
  await writable.close();
};

// --- Ресурсы игры: спрайты, звуки, музыка лежат в папках рядом с index.html. ---

export type AssetFolder = 'sprites' | 'sounds' | 'music' | 'maps';

// --- Недавние игры: показываем на стартовом экране. ---

export type RecentGame = {|
  id: string,
  title: string,
  /** Приложение: путь к папке. В браузере: null, папка лежит в IndexedDB. */
  path: ?string,
  openedAt: number,
|};

const RECENT_KEY = 'vf-codegame-recent';

export const loadRecentGames = (): Array<RecentGame> => {
  try {
    const list = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
};

const saveRecentGames = (list: Array<RecentGame>) => {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch (error) {
    // без истории тоже можно жить
  }
};

export const forgetRecentGame = (id: string) =>
  saveRecentGames(loadRecentGames().filter(item => item.id !== id));

/** Запоминает открытую папку (в браузере сохраняет и сам handle). */
export const rememberGame = async (
  directory: any,
  title: string
): Promise<void> => {
  const list = loadRecentGames();
  let id: ?string = null;
  const path = directory.desktopPath || null;
  if (path) {
    id = path;
  } else {
    for (const item of list) {
      try {
        const stored = await loadDirectoryHandle(`codegame:${item.id}`);
        if (stored && (await stored.isSameEntry(directory))) {
          id = item.id;
          break;
        }
      } catch (error) {
        // не получилось сравнить: считаем новой
      }
    }
    if (!id) id = `g${Date.now()}`;
    try {
      await saveDirectoryHandle(`codegame:${id}`, directory);
    } catch (error) {
      return;
    }
  }
  const entry: RecentGame = { id, title, path, openedAt: Date.now() };
  saveRecentGames([entry, ...list.filter(item => item.id !== id)]);
};

/** Открывает запомненную папку снова (в браузере спросит доступ). */
export const reopenRecentGame = async (recent: RecentGame): Promise<any> => {
  if (recent.path) {
    if (!nodeFs || !nodeFs.existsSync(recent.path)) {
      throw new Error('Этой папки больше нет на диске.');
    }
    return { desktopPath: recent.path };
  }
  const handle = await loadDirectoryHandle(`codegame:${recent.id}`);
  if (!handle) throw new Error('Папка забыта. Открой её заново.');
  const permission = { mode: 'readwrite' };
  if ((await handle.queryPermission(permission)) !== 'granted') {
    if ((await handle.requestPermission(permission)) !== 'granted') {
      throw new Error('Нет доступа к папке.');
    }
  }
  return handle;
};

export const listAssets = async (
  directory: any,
  folder: AssetFolder
): Promise<Array<string>> => {
  try {
    if (directory.desktopPath) {
      const target = nodePath.join(directory.desktopPath, folder);
      if (!nodeFs.existsSync(target)) return [];
      return nodeFs
        .readdirSync(target)
        .filter(
          name => !nodeFs.statSync(nodePath.join(target, name)).isDirectory()
        )
        .sort();
    }
    const subDirectory = await directory.getDirectoryHandle(folder);
    const names = [];
    for await (const [name, handle] of subDirectory.entries()) {
      if (handle.kind === 'file') names.push(name);
    }
    return names.sort();
  } catch (error) {
    return [];
  }
};

/** Адрес для показа файла ресурса (blob:), размер в байтах. */
export const readAssetUrl = async (
  directory: any,
  folder: AssetFolder,
  name: string
): Promise<{| url: string, size: number |}> => {
  let blob;
  if (directory.desktopPath) {
    const buffer = nodeFs.readFileSync(
      nodePath.join(directory.desktopPath, folder, name)
    );
    blob = new Blob([buffer], { type: getContentType(name) });
  } else {
    const subDirectory = await directory.getDirectoryHandle(folder);
    const file = await (await subDirectory.getFileHandle(name)).getFile();
    blob = new Blob([await file.arrayBuffer()], { type: getContentType(name) });
  }
  return { url: URL.createObjectURL(blob), size: blob.size };
};

/**
 * Для запуска: перед игрой вставляем скрипт, который пересылает console.log,
 * ошибки и необработанные отказы в окно редактора (панель «Консоль»).
 */
export const injectConsoleBridge = (html: string): string => {
  const bridge = `<script>(function(){function send(type,args){try{window.parent.postMessage({__vf:true,type:type,text:Array.prototype.map.call(args,function(a){try{return typeof a==='string'?a:JSON.stringify(a)}catch(e){return String(a)}}).join(' ')},'*')}catch(e){}}['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){send(k,arguments);try{o.apply(console,arguments)}catch(e){}}});window.addEventListener('error',function(e){send('error',[e.message+' ('+(e.filename||'').split('/').pop()+':'+e.lineno+')'])});window.addEventListener('unhandledrejection',function(e){send('error',['Promise: '+(e.reason&&e.reason.message||e.reason)])})})();</script>`;
  return html.replace(/<head>/i, `<head>${bridge}`);
};

// --- Новая игра с нуля: кладём в пустую папку движок и пустой main.ms. ---

const TEMPLATE_FILES = [
  'compiler.js',
  'parser.js',
  'processor.js',
  'program.js',
  'routine.js',
  'runner.js',
  'token.js',
  'tokenizer.js',
  'transpiler.js',
  'microengine.js',
  'icon16.png',
  'icon32.png',
  'icon64.png',
  'icon180.png',
  'icon192.png',
  'icon512.png',
  'icon1024.png',
];

const loadTemplateFile = (name: string): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', `codegame-template/${name}`);
    request.responseType = 'arraybuffer';
    request.onload = () =>
      (request.status === 200 || request.status === 0) && request.response
        ? resolve(request.response)
        : reject(new Error(`Не нашёл файл шаблона ${name}.`));
    request.onerror = () => reject(new Error(`Не нашёл файл шаблона ${name}.`));
    request.send();
  });

const writeFileTo = async (
  directory: any,
  relativePath: string,
  data: ArrayBuffer | string
): Promise<void> => {
  if (directory.desktopPath) {
    const full = nodePath.join(directory.desktopPath, relativePath);
    nodeFs.mkdirSync(nodePath.dirname(full), { recursive: true });
    nodeFs.writeFileSync(
      full,
      typeof data === 'string' ? data : Buffer.from(data)
    );
    return;
  }
  const parts = relativePath.split('/');
  const fileName = parts.pop();
  let current = directory;
  for (const part of parts) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  const fileHandle = await current.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
};

export const NEW_GAME_MAIN = `// Игра на microScript. Нажми «Запуск» (F5), чтобы увидеть результат.

// Вызывается один раз при старте.
init = function()
  x = 0
end

// Вызывается 60 раз в секунду: логика игры.
update = function()
  x = x + 0.4
  if x > screen.width / 2 then x = -screen.width / 2 end
end

// Вызывается каждый кадр: рисование.
draw = function()
  screen.clear("rgb(18,14,12)")
  screen.fillRoundRect(x, 0, 30, 30, 8, "rgb(255,138,61)")
  screen.drawText("Привет, VoxForge!", 0, 60, 18, "rgb(244,237,229)")
end
`;

/** Создаёт новую игру в выбранной пустой папке и возвращает название файла кода. */
export const createBlankGame = async (
  directory: any,
  title: string
): Promise<void> => {
  // Не затираем чужую игру.
  if (directory.desktopPath) {
    if (nodeFs.existsSync(nodePath.join(directory.desktopPath, 'index.html'))) {
      throw new Error(
        'В этой папке уже есть игра. Выбери пустую папку или открой эту игру.'
      );
    }
  } else {
    const permission = { mode: 'readwrite' };
    if ((await directory.queryPermission(permission)) !== 'granted') {
      if ((await directory.requestPermission(permission)) !== 'granted') {
        throw new Error('Нет разрешения на запись в папку.');
      }
    }
    let hasIndex = true;
    try {
      await directory.getFileHandle('index.html');
    } catch (error) {
      hasIndex = false;
    }
    if (hasIndex) {
      throw new Error(
        'В этой папке уже есть игра. Выбери пустую папку или открой эту игру.'
      );
    }
  }

  const safeTitle = title.trim() || 'Моя игра';
  const escapedTitle = safeTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  for (const name of TEMPLATE_FILES) {
    await writeFileTo(directory, name, await loadTemplateFile(name));
  }
  const template = new TextDecoder().decode(
    await loadTemplateFile('index.template.html')
  );
  const emptyHtml = template
    .replace('{{TITLE}}', () => escapedTitle)
    .replace('{{CODE}}', () => '');
  const game = parseCodeGame(emptyHtml);
  game.files.push({ name: 'main.ms', text: NEW_GAME_MAIN, original: '' });
  await writeFileTo(directory, 'index.html', buildCodeGameHtml(game));
  await writeFileTo(
    directory,
    'manifest.json',
    JSON.stringify(
      {
        name: safeTitle,
        short_name: safeTitle,
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '.',
        icons: [
          { src: 'icon192.png', type: 'image/png', sizes: '192x192' },
          { src: 'icon512.png', type: 'image/png', sizes: '512x512' },
        ],
      },
      null,
      2
    )
  );
  for (const folder of ['sprites', 'sounds', 'music', 'maps']) {
    if (directory.desktopPath) {
      nodeFs.mkdirSync(nodePath.join(directory.desktopPath, folder), {
        recursive: true,
      });
    } else {
      await directory.getDirectoryHandle(folder, { create: true });
    }
  }
};

// --- Ресурсы игры: добавить, удалить, обновить список resources в index.html. ---

export const ASSET_ACCEPT: { [folder: string]: string } = {
  sprites: '.png,.jpg,.jpeg',
  sounds: '.wav,.mp3,.ogg',
  music: '.mp3,.ogg,.wav',
  maps: '.json',
};

const RESOURCE_KEY: { [folder: string]: string } = {
  sprites: 'images',
  sounds: 'sounds',
  music: 'music',
};

const RESOURCES_PATTERN = /var resources = (\{[\s\S]*?\});\s*\n?\s*var graphics/;

const sanitizeAssetName = (name: string): string =>
  name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_.\-]/gu, '');

type AssetEntry = {|
  file: string,
  version: number,
  size: number,
  properties: Object,
|};

const listAssetSizes = async (
  directory: any,
  folder: string
): Promise<Array<{| name: string, size: number |}>> => {
  try {
    if (directory.desktopPath) {
      const target = nodePath.join(directory.desktopPath, folder);
      if (!nodeFs.existsSync(target)) return [];
      return nodeFs
        .readdirSync(target)
        .map(name => ({
          name,
          size: nodeFs.statSync(nodePath.join(target, name)).size,
          isDir: nodeFs.statSync(nodePath.join(target, name)).isDirectory(),
        }))
        .filter(item => !item.isDir)
        .map(({ name, size }) => ({ name, size }));
    }
    const subDirectory = await directory.getDirectoryHandle(folder);
    const result = [];
    for await (const [name, handle] of subDirectory.entries()) {
      if (handle.kind === 'file') {
        result.push({ name, size: (await handle.getFile()).size });
      }
    }
    return result;
  } catch (error) {
    return [];
  }
};

/** Копирует выбранные файлы в папку ресурсов. Возвращает имена добавленных. */
export const importAssetFiles = async (
  directory: any,
  folder: AssetFolder,
  files: Array<File>
): Promise<Array<string>> => {
  const allowed = (ASSET_ACCEPT[folder] || '').split(',');
  const added = [];
  for (const file of files) {
    const extension = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
    if (!allowed.includes(extension)) continue;
    const name = sanitizeAssetName(file.name);
    if (!name) continue;
    await writeFileTo(directory, `${folder}/${name}`, await file.arrayBuffer());
    added.push(name);
  }
  return added;
};

export const deleteAssetFile = async (
  directory: any,
  folder: AssetFolder,
  name: string
): Promise<void> => {
  if (directory.desktopPath) {
    nodeFs.unlinkSync(nodePath.join(directory.desktopPath, folder, name));
    return;
  }
  const subDirectory = await directory.getDirectoryHandle(folder);
  await subDirectory.removeEntry(name);
};

/**
 * Пересобирает список resources в index.html по тому, что лежит в папках.
 * У старых файлов остаются свои настройки (кадры, скорость), у новых по умолчанию.
 */
export const syncResourcesInHtml = async (
  directory: any,
  html: string,
  changedNames: Array<string> = []
): Promise<string> => {
  const match = RESOURCES_PATTERN.exec(html);
  if (!match) return html;
  let previous: { [key: string]: Array<AssetEntry> } = {};
  try {
    previous = JSON.parse(match[1]);
  } catch (error) {
    previous = {};
  }
  const next: { [key: string]: Array<AssetEntry> } = { ...previous };
  for (const folder of Object.keys(RESOURCE_KEY)) {
    const key = RESOURCE_KEY[folder];
    const old = previous[key] || [];
    const sizes = await listAssetSizes(directory, folder);
    next[key] = sizes
      .map(({ name, size }) => {
        const existing = old.find(entry => entry.file === name);
        const touched = changedNames.includes(`${folder}/${name}`);
        return {
          file: name,
          version: existing ? existing.version + (touched ? 1 : 0) : 1,
          size,
          properties: existing
            ? existing.properties
            : folder === 'sprites'
            ? { frames: 1, fps: 5 }
            : {},
        };
      })
      .sort((a, b) => (a.file < b.file ? -1 : 1));
  }
  return html.replace(RESOURCES_PATTERN, () =>
    `var resources = ${JSON.stringify(next)};\nvar graphics`
  );
};

/** Кадры и скорость анимации спрайта из списка resources. */
export const getSpriteProps = (
  html: string,
  file: string
): {| frames: number, fps: number |} => {
  const match = RESOURCES_PATTERN.exec(html);
  try {
    const parsed = match ? JSON.parse(match[1]) : {};
    const entry = (parsed.images || []).find(item => item.file === file);
    const properties = (entry && entry.properties) || {};
    return {
      frames: Number(properties.frames) || 1,
      fps: Number(properties.fps) || 5,
    };
  } catch (error) {
    return { frames: 1, fps: 5 };
  }
};

export const setSpriteProps = (
  html: string,
  file: string,
  props: {| frames: number, fps: number |}
): string => {
  const match = RESOURCES_PATTERN.exec(html);
  if (!match) return html;
  try {
    const parsed = JSON.parse(match[1]);
    const entry = (parsed.images || []).find(item => item.file === file);
    if (!entry) return html;
    entry.properties = {
      ...entry.properties,
      frames: Math.max(1, Math.round(props.frames)),
      fps: Math.max(1, Math.round(props.fps)),
    };
    entry.version = (entry.version || 1) + 1;
    return html.replace(RESOURCES_PATTERN, () =>
      `var resources = ${JSON.stringify(parsed)};\nvar graphics`
    );
  } catch (error) {
    return html;
  }
};
