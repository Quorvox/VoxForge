// @flow
import VersionMetadata from './VersionMetadata';
import semverGreaterThan from 'semver/functions/gt';

// Версия VoxForge, которую видит пользователь. Это не то же самое, что
// getIDEVersion(): та — версия кода GDevelop, на котором построен движок, она
// нужна внутри для проверки совместимости расширений, примеров и проектов,
// поэтому её не подменяем.
export const VOXFORGE_VERSION = '0.1.0';
export const getVoxForgeVersion = (): string => VOXFORGE_VERSION;

export const getIDEVersion = (): string => VersionMetadata.version;
export const getIDEVersionWithHash = (): string =>
  VersionMetadata.versionWithHash;

let gdCoreVersionString = '';
export const getGDCoreVersion = (): string => {
  if (gdCoreVersionString) return gdCoreVersionString;

  const gd: libGDevelop = global.gd;
  gdCoreVersionString = gd ? gd.VersionWrapper.fullString() : 'Unknown';
  return gdCoreVersionString;
};

export const shouldHideExtension = (
  project: gdProject,
  extension: gdPlatformExtension
): boolean => {
  const initialGDVersion = project.getInitialGDVersion();
  return (
    !!initialGDVersion &&
    extension.isDeprecated() &&
    !semverGreaterThan(extension.getDeprecationGDVersion(), initialGDVersion)
  );
};
