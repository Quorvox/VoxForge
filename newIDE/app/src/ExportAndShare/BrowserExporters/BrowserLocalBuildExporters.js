// @flow
// VoxForge: экспорт «Android APK» и «Windows EXE». Используют обычный экспорт
// проекта (Cordova/Electron), а APK/EXE собирает локальный сборщик на этом же
// компьютере (папка voxforge-builder), без облака GDevelop.
import * as React from 'react';
import Text from '../../UI/Text';
import { type ExportPipeline } from '../ExportPipeline.flow';
import { browserCordovaExportPipeline } from './BrowserCordovaExport';
import { browserElectronExportPipeline } from './BrowserElectronExport';
import { ExportFlow as CordovaExportFlow } from '../GenericExporters/CordovaExport';
import { ExportFlow as ElectronExportFlow } from '../GenericExporters/ElectronExport';
import LocalBuildFooter from './LocalBuildFooter';

const appNameFromBlob = (blob: any): string =>
  ((blob && blob.name) || 'game.zip').replace(/\.zip$/i, '');

/** Тот же zip, но с именем игры, чтобы футер знал, как назвать файл. */
const withNamedCompression = (basePipeline: any) => (
  context: any,
  output: any
) =>
  basePipeline.launchCompression(context, output).then(
    (blob: Blob) =>
      new File([blob], `${context.project.getName() || 'game'}.zip`, {
        type: 'application/zip',
      })
  );

// $FlowFixMe[incompatible-type]
export const browserLocalApkExportPipeline: ExportPipeline<
  any,
  any,
  any,
  any,
  any
> = {
  ...browserCordovaExportPipeline,
  name: 'browser-local-apk',
  renderHeader: () => (
    <Text align="center">
      Игра будет собрана в APK прямо на этом компьютере (нужен запущенный
      сборщик VoxForge, Android SDK и JDK 17).
    </Text>
  ),
  renderExportFlow: props => (
    <CordovaExportFlow {...props} exportPipelineName="browser-local-apk" />
  ),
  launchCompression: withNamedCompression(browserCordovaExportPipeline),
  renderDoneFooter: ({ compressionOutput }) => (
    <LocalBuildFooter
      kind="android"
      zipBlob={compressionOutput}
      appName={appNameFromBlob(compressionOutput)}
    />
  ),
};

// $FlowFixMe[incompatible-type]
export const browserLocalExeExportPipeline: ExportPipeline<
  any,
  any,
  any,
  any,
  any
> = {
  ...browserElectronExportPipeline,
  name: 'browser-local-exe',
  renderHeader: () => (
    <Text align="center">
      Игра будет собрана в EXE для Windows на этом компьютере (нужен запущенный
      сборщик VoxForge).
    </Text>
  ),
  renderExportFlow: props => (
    <ElectronExportFlow {...props} exportPipelineName="browser-local-exe" />
  ),
  launchCompression: withNamedCompression(browserElectronExportPipeline),
  renderDoneFooter: ({ compressionOutput }) => (
    <LocalBuildFooter
      kind="windows"
      zipBlob={compressionOutput}
      appName={appNameFromBlob(compressionOutput)}
    />
  ),
};
