// @flow
import {
  type ResourceMover,
  type MoveAllProjectResourcesOptions,
  type MoveAllProjectResourcesResult,
  type MoveAllProjectResourcesFunction,
} from './index';
import CloudStorageProvider from '../CloudStorageProvider';
import UrlStorageProvider from '../UrlStorageProvider';
import DownloadFileStorageProvider from '../DownloadFileStorageProvider';
import BrowserStorageProvider from '../BrowserStorageProvider';
import FolderStorageProvider from '../FolderStorageProvider';
import { moveUrlResourcesToCloudProject } from '../CloudStorageProvider/CloudResourceMover';

const moveNothing = async () => {
  return {
    erroredResources: [],
  };
};

const movers: {
  [string]: MoveAllProjectResourcesFunction,
} = {
  // Moving to GDevelop "Cloud" storage:

  // From a Cloud project to another, resources need to be copied
  // (unless they are public URLs).
  [`${CloudStorageProvider.internalName}=>${
    CloudStorageProvider.internalName
  }`]: moveUrlResourcesToCloudProject,
  // On the web-app, most resources are public URLs, so nothing to do.
  // But if some resources are coming from a private game template,
  // they need to be copied.
  [`${UrlStorageProvider.internalName}=>${
    CloudStorageProvider.internalName
  }`]: moveUrlResourcesToCloudProject,

  // Moving to "DownloadFile":

  // Saving to "DownloadFile" will *not* change any resources, as it's a
  // "temporary save" that is made and given to the user.
  // $FlowFixMe[incompatible-type]
  [`${CloudStorageProvider.internalName}=>${
    DownloadFileStorageProvider.internalName
  }`]: moveNothing,
  // $FlowFixMe[incompatible-type]
  [`${UrlStorageProvider.internalName}=>${
    DownloadFileStorageProvider.internalName
  }`]: moveNothing,
};

// VoxForge: проекты в браузере хранят ресурсы ссылками, переносить нечего.
const browserName = BrowserStorageProvider.internalName;
const browserMovers: { [string]: MoveAllProjectResourcesFunction } = {
  [`${UrlStorageProvider.internalName}=>${browserName}`]: moveNothing,
  [`${browserName}=>${browserName}`]: moveNothing,
  [`${browserName}=>${DownloadFileStorageProvider.internalName}`]: moveNothing,
  [`${CloudStorageProvider.internalName}=>${browserName}`]: moveNothing,
};
const folderName = FolderStorageProvider.internalName;
const folderMovers: { [string]: MoveAllProjectResourcesFunction } = {
  [`${UrlStorageProvider.internalName}=>${folderName}`]: moveNothing,
  [`${browserName}=>${folderName}`]: moveNothing,
  [`${folderName}=>${folderName}`]: moveNothing,
  [`${folderName}=>${browserName}`]: moveNothing,
  [`${folderName}=>${DownloadFileStorageProvider.internalName}`]: moveNothing,
  [`${CloudStorageProvider.internalName}=>${folderName}`]: moveNothing,
};
Object.assign(movers, browserMovers, folderMovers);

const BrowserResourceMover: ResourceMover = {
  moveAllProjectResources: async (
    options: MoveAllProjectResourcesOptions
  ): Promise<MoveAllProjectResourcesResult> => {
    const { oldStorageProvider, newStorageProvider } = options;
    const mover =
      movers[
        `${oldStorageProvider.internalName}=>${newStorageProvider.internalName}`
      ];
    // $FlowFixMe[constant-condition]
    if (!mover)
      throw new Error(
        `Can't find a ResourceMover for ${oldStorageProvider.internalName} to ${
          newStorageProvider.internalName
        }.`
      );

    return mover(options);
  },
};

export default BrowserResourceMover;
