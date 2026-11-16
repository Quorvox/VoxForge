// @flow
// VoxForge: готовые раскладки редактора сцены. Узел — дерево react-mosaic:
// 'row' — панели рядом, 'column' — друг под другом, строка — имя панели.

const unityRow = {
  direction: 'row',
  first: 'objects-list',
  splitPercentage: 20,
  second: {
    direction: 'row',
    first: 'instances-editor',
    second: 'properties',
    splitPercentage: 76,
  },
};

export type SceneLayoutPreset = {|
  name: string,
  node: any,
|};

export const sceneLayoutPresets: Array<SceneLayoutPreset> = [
  { name: 'Как в Unity', node: unityRow },
  {
    name: 'С нижней панелью',
    node: {
      direction: 'column',
      first: unityRow,
      second: 'instances-list',
      splitPercentage: 74,
    },
  },
  {
    name: 'Широкая сцена',
    node: {
      direction: 'row',
      first: 'instances-editor',
      second: 'properties',
      splitPercentage: 80,
    },
  },
  {
    name: 'Классика',
    node: {
      direction: 'row',
      first: 'properties',
      splitPercentage: 23,
      second: {
        direction: 'row',
        first: 'instances-editor',
        second: 'objects-list',
        splitPercentage: 77,
      },
    },
  },
];
