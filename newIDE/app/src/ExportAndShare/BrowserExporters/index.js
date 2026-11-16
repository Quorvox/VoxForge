// @flow
import { type Exporter } from '../ShareDialog';
import { browserOnlineCordovaExportPipeline } from './BrowserOnlineCordovaExport';
import { browserOnlineCordovaIosExportPipeline } from './BrowserOnlineCordovaIosExport';
import { browserOnlineElectronExportPipeline } from './BrowserOnlineElectronExport';
import { browserOnlineWebExportPipeline } from './BrowserOnlineWebExport';
import { browserHTML5ExportPipeline } from './BrowserHTML5Export';
import { browserCordovaExportPipeline } from './BrowserCordovaExport';
import { browserElectronExportPipeline } from './BrowserElectronExport';
import { browserFacebookInstantGamesExportPipeline } from './BrowserFacebookInstantGamesExport';
import { cordovaExporter } from '../GenericExporters/CordovaExport';
import { onlineWebExporter } from '../GenericExporters/OnlineWebExport';
import { html5Exporter } from '../GenericExporters/HTML5Export';
import { facebookInstantGamesExporter } from '../GenericExporters/FacebookInstantGamesExport';
import { onlineCordovaExporter } from '../GenericExporters/OnlineCordovaExport';
import { onlineCordovaIosExporter } from '../GenericExporters/OnlineCordovaIosExport';
import { onlineElectronExporter } from '../GenericExporters/OnlineElectronExport';
import { electronExporter } from '../GenericExporters/ElectronExport';
import {
  browserLocalApkExportPipeline,
  browserLocalExeExportPipeline,
} from './BrowserLocalBuildExporters';

// VoxForge: свои экспортёры вместо облачной сборки GDevelop.
const localApkExporter = {
  key: 'onlinecordovaexport',
  tabName: 'Android',
  name: 'Android (APK)',
  helpPage: '/publishing/android',
};
const localExeExporter = {
  key: 'onlineelectronexport',
  tabName: 'Windows',
  name: 'Windows (EXE)',
  helpPage: '/publishing/windows-macos-linux',
};

// $FlowFixMe[incompatible-type]
export const browserOnlineWebExporter: Exporter = {
  ...onlineWebExporter,
  exportPipeline: browserOnlineWebExportPipeline,
};

export const browserAutomatedExporters: Array<Exporter> = [
  // $FlowFixMe[incompatible-type]
  {
    ...html5Exporter,
    exportPipeline: browserHTML5ExportPipeline,
  },
  // $FlowFixMe[incompatible-type]
  {
    ...localApkExporter,
    exportPipeline: browserLocalApkExportPipeline,
  },
  // $FlowFixMe[incompatible-type]
  {
    ...localExeExporter,
    exportPipeline: browserLocalExeExportPipeline,
  },
  // $FlowFixMe[incompatible-type]
  {
    ...facebookInstantGamesExporter,
    exportPipeline: browserFacebookInstantGamesExportPipeline,
  },
];

export const browserManualExporters: Array<Exporter> = [
  // $FlowFixMe[incompatible-type]
  {
    ...html5Exporter,
    exportPipeline: browserHTML5ExportPipeline,
  },
  // $FlowFixMe[incompatible-type]
  {
    ...cordovaExporter,
    exportPipeline: browserCordovaExportPipeline,
  },
  // $FlowFixMe[incompatible-type]
  {
    ...electronExporter,
    exportPipeline: browserElectronExportPipeline,
  },
];
