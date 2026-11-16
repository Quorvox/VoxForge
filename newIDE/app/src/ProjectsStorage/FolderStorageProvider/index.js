// @flow
import * as React from 'react';
import {
  type StorageProvider,
  type FileMetadata,
  type SaveAsLocation,
} from '../index';
import Computer from '../../UI/CustomSvgIcons/Computer';
import {
  generateProjectId,
  loadDirectoryHandle,
  saveDirectoryHandle,
} from '../BrowserStorageProvider/BrowserProjectDatabase';
import {
  MAIN_PROJECT_FILE,
  ensureWritePermission,
  fileExists,
  readProjectFromFolder,
  writeProjectToFolder,
} from './FolderProjectFiles';
import FolderLocationChooser, { pickProjectFolder } from './FolderLocationChooser';
import { vf } from '../../Utils/i18n/vfStrings';

export const folderStorageProviderInternalName = 'Folder';

const getProjectName = (project: gdProject): string =>
  (project.getName() || '').trim() || 'Проект без названия';

const getHandle = async (fileIdentifier: string): Promise<any> => {
  const handle = await loadDirectoryHandle(fileIdentifier);
  if (!handle) {
    throw new Error(
      'Не нашёл доступ к папке проекта. Открой папку заново: «Открыть проект» → «Папка на компьютере».'
    );
  }
  return handle;
};

/**
 * VoxForge: проект лежит в обычной папке на компьютере (как настоящие файлы).
 * Папку можно открыть в VS Code, править файлы и открыть проект заново.
 * Доступно в браузерах на Chromium (Chrome, Edge).
 */
export default ({
  internalName: folderStorageProviderInternalName,
  get name() {
    return vf('Папка на компьютере (файлы для VS Code)');
  },
  renderIcon: props => <Computer fontSize={props.size} />,
  getProjectLocation: ({ projectName, saveAsLocation }): SaveAsLocation =>
    saveAsLocation || { name: projectName },
  renderNewProjectSaveAsLocationChooser: ({
    saveAsLocation,
    setSaveAsLocation,
  }) => (
    <FolderLocationChooser
      saveAsLocation={saveAsLocation}
      setSaveAsLocation={setSaveAsLocation}
    />
  ),
  createOperations: () => ({
    // «Открыть проект» → «Папка на компьютере»: выбрать папку с game.json.
    onOpenWithPicker: async (): Promise<?FileMetadata> => {
      const location = await pickProjectFolder();
      if (!location || !location.fileIdentifier) return null;
      const handle = await getHandle(location.fileIdentifier);
      if (!(await fileExists(handle, MAIN_PROJECT_FILE))) {
        throw new Error(
          `В этой папке нет файла ${MAIN_PROJECT_FILE}. Выбери папку проекта VoxForge.`
        );
      }
      return {
        fileIdentifier: location.fileIdentifier,
        name: handle.name,
        lastModifiedDate: Date.now(),
      };
    },
    onOpen: async (fileMetadata: FileMetadata) => {
      const handle = await getHandle(fileMetadata.fileIdentifier);
      // Если разрешение истекло, браузер спросит снова (после клика человека).
      await ensureWritePermission(handle);
      return { content: await readProjectFromFolder(handle) };
    },
    onSaveProject: async (project: gdProject, fileMetadata: FileMetadata) => {
      const handle = await getHandle(fileMetadata.fileIdentifier);
      await writeProjectToFolder(project, handle);
      return {
        wasSaved: true,
        fileMetadata: { ...fileMetadata, lastModifiedDate: Date.now() },
      };
    },
    // «Сохранить как…»: выбираем новую папку.
    onChooseSaveProjectAsLocation: async () => {
      const location = await pickProjectFolder();
      return { saveAsLocation: location, saveAsOptions: null };
    },
    onSaveProjectAs: async (
      project: gdProject,
      saveAsLocation: ?SaveAsLocation,
      options
    ) => {
      if (!saveAsLocation || !saveAsLocation.fileIdentifier) {
        throw new Error('Сначала выбери папку для проекта.');
      }
      options.onStartSaving();
      const handle = await getHandle(saveAsLocation.fileIdentifier);
      await ensureWritePermission(handle);
      if (await fileExists(handle, MAIN_PROJECT_FILE)) {
        throw new Error(
          'В этой папке уже есть проект VoxForge. Выбери пустую папку, чтобы ничего не перезаписать.'
        );
      }
      await writeProjectToFolder(project, handle);
      // Новая запись доступа под новым идентификатором, если «Сохранить как».
      const fileIdentifier = saveAsLocation.fileIdentifier || generateProjectId();
      await saveDirectoryHandle(fileIdentifier, handle);
      return {
        wasSaved: true,
        fileMetadata: {
          fileIdentifier,
          name: getProjectName(project),
          lastModifiedDate: Date.now(),
        },
      };
    },
    getOpenErrorMessage: (error: Error) =>
      error && error.message
        ? error.message
        : 'Не получилось открыть проект из папки.',
    getWriteErrorMessage: (error: Error) =>
      error && error.message
        ? error.message
        : 'Не получилось сохранить проект в папку. Проверь доступ к ней.',
  }),
}: StorageProvider);
