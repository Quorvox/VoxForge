// @flow
import * as React from 'react';
import {
  type StorageProvider,
  type FileMetadata,
  type SaveAsLocation,
} from '../index';
import Computer from '../../UI/CustomSvgIcons/Computer';
import { serializeToJSON } from '../../Utils/Serializer';
import {
  generateProjectId,
  loadStoredProject,
  saveStoredProject,
} from './BrowserProjectDatabase';
import { vf } from '../../Utils/i18n/vfStrings';

export const browserStorageProviderInternalName = 'Browser';

const getProjectDisplayName = (project: gdProject): string =>
  (project.getName() || '').trim() || 'Проект без названия';

const writeProject = async (
  project: gdProject,
  id: string,
  name: string
): Promise<FileMetadata> => {
  const lastModifiedDate = Date.now();
  await saveStoredProject({
    id,
    name,
    content: serializeToJSON(project),
    lastModifiedDate,
  });
  return { fileIdentifier: id, name, lastModifiedDate };
};

/**
 * VoxForge: хранение проектов в самом браузере, на компьютере человека.
 * Ничего не уходит на сервер, поэтому ни аккаунт, ни интернет не нужны.
 * Ресурсы (картинки, звуки) остаются ссылками: для готовых шаблонов это
 * адреса примеров.
 */
export default ({
  internalName: browserStorageProviderInternalName,
  get name() {
    return vf('В браузере на этом компьютере');
  },
  renderIcon: props => <Computer fontSize={props.size} />,
  // Проекты открываются из раздела «Проекты» на главной.
  hiddenInOpenDialog: true,
  getProjectLocation: ({ projectName }): SaveAsLocation => ({
    name: projectName,
  }),
  // Выбирать место не нужно: оно одно.
  renderNewProjectSaveAsLocationChooser: () => null,
  createOperations: () => ({
    onOpen: async (fileMetadata: FileMetadata) => {
      const stored = await loadStoredProject(fileMetadata.fileIdentifier);
      if (!stored) {
        throw new Error(
          'Проект не найден в этом браузере. Возможно, данные сайта были очищены.'
        );
      }
      return { content: JSON.parse(stored.content) };
    },
    onSaveProject: async (project: gdProject, fileMetadata: FileMetadata) => {
      const name = getProjectDisplayName(project);
      const newFileMetadata = await writeProject(
        project,
        fileMetadata.fileIdentifier,
        name
      );
      return {
        wasSaved: true,
        fileMetadata: { ...fileMetadata, ...newFileMetadata },
      };
    },
    // «Сохранить как» без вопросов: создаём ещё одну запись в браузере.
    onChooseSaveProjectAsLocation: async ({ project }) => ({
      saveAsLocation: { name: getProjectDisplayName(project) },
      saveAsOptions: { generateNewProjectUuid: false },
    }),
    onSaveProjectAs: async (
      project: gdProject,
      saveAsLocation: ?SaveAsLocation,
      options
    ) => {
      options.onStartSaving();
      const name =
        (saveAsLocation && saveAsLocation.name) ||
        getProjectDisplayName(project);
      const id =
        (saveAsLocation && saveAsLocation.fileIdentifier) ||
        generateProjectId();
      const fileMetadata = await writeProject(project, id, name);
      return { wasSaved: true, fileMetadata };
    },
    getOpenErrorMessage: () =>
      'Не получилось открыть проект из браузера. Проверь, что данные сайта не очищались.',
    getWriteErrorMessage: () =>
      'Не получилось сохранить проект в браузере. Возможно, закончилось место или включён приватный режим.',
  }),
}: StorageProvider);
