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

const electron = optionalRequire('electron');
const nodeFs = optionalRequire('fs');
const nodePath = optionalRequire('path');
const nodeHttp = optionalRequire('http');

/** Папка игры: в браузере — handle (File System Access), в приложении — путь. */
export const isDesktopApp = (): boolean => !!electron;

export const pickGameFolderDesktop = async (): Promise<?{|
  desktopPath: string,
|}> => {
  const remote = optionalRequire('@electron/remote');
  if (!remote) throw new Error('Не удалось открыть окно выбора папки.');
  const result = await remote.dialog.showOpenDialog({
    title: 'Папка игры microStudio',
    properties: ['openDirectory'],
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

export type AssetFolder = 'sprites' | 'sounds' | 'music';

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
