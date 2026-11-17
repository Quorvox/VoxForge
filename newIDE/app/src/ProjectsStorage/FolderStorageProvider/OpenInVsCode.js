// @flow
// VoxForge: «Открыть в VS Code». Браузер не знает путь к выбранной папке (так
// устроена защита), поэтому полный путь человек вводит один раз, мы его помним.
import optionalRequire from '../../Utils/OptionalRequire';
import { loadDirectoryHandle } from '../BrowserStorageProvider/BrowserProjectDatabase';

const getStorageKey = (projectFile: string) => `vf-folder-path:${projectFile}`;

const readStoredPath = (projectFile: string): string => {
  try {
    return window.localStorage.getItem(getStorageKey(projectFile)) || '';
  } catch (error) {
    return '';
  }
};

const storePath = (projectFile: string, path: string) => {
  try {
    window.localStorage.setItem(getStorageKey(projectFile), path);
  } catch (error) {
    // Не страшно: путь спросим снова.
  }
};

/**
 * Открывает папку проекта в VS Code (через ссылку vscode://).
 * Возвращает false, если проект лежит не в папке на компьютере.
 */
export const openProjectInVsCode = async (
  projectFile: string
): Promise<boolean> => {
  if (!projectFile) return false;

  // Приложение: проект лежит по настоящему пути, в VS Code открываем его папку.
  // (window.prompt в Electron не работает, поэтому путь не спрашиваем.)
  const electron = optionalRequire('electron');
  const nodeFs = optionalRequire('fs');
  const nodePath = optionalRequire('path');
  if (electron && nodeFs && nodePath && nodeFs.existsSync(projectFile)) {
    const folder = nodeFs.statSync(projectFile).isDirectory()
      ? projectFile
      : nodePath.dirname(projectFile);
    const normalizedFolder = folder.replace(/\\/g, '/').replace(/\/+$/, '');
    electron.shell.openExternal(`vscode://file/${encodeURI(normalizedFolder)}`);
    return true;
  }

  let handle = null;
  try {
    handle = await loadDirectoryHandle(projectFile);
  } catch (error) {
    handle = null;
  }
  if (!handle) {
    window.alert(
      'Этот проект не в папке на компьютере. Создай проект с хранением «Папка на компьютере (файлы для VS Code)» или открой такой через «Открыть проект».'
    );
    return false;
  }

  let path = readStoredPath(projectFile);
  if (!path) {
    path =
      window.prompt(
        `Полный путь к папке «${handle.name}» на диске (например, A:\\Projects\\${handle.name}). Спрошу один раз:`
      ) || '';
    path = path.trim();
    if (!path) return false;
    storePath(projectFile, path);
  }

  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
  window.location.href = `vscode://file/${encodeURI(normalized)}`;
  return true;
};
