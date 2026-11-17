// @flow
import axios from 'axios';
import { GDevelopAssetApi } from './ApiConfigs';
import { type Filters } from './Filters';
import { type UserPublicProfile } from './User';
import { retryIfFailed } from '../RetryIfFailed';

export type ExampleShortHeader = {|
  id: string,
  slug: string,
  name: string,
  shortDescription: string,
  description: string,
  license: string,
  tags: Array<string>,
  authors?: Array<UserPublicProfile>,
  authorIds?: Array<string>,
  previewImageUrls: Array<string>,
  gdevelopVersion: string,
  codeSizeLevel: string,
  difficultyLevel?: string,
  linkedExampleShortHeaders?: Array<{ slug: string, relation: string }>,
|};

export type Example = {|
  ...ExampleShortHeader,
  projectFileUrl: string,
  authors: Array<string>,
|};

export type AllExamples = {|
  exampleShortHeaders: Array<ExampleShortHeader>,
  filters: Filters,
|};

// VoxForge: на нашем сайте список шаблонов лежит рядом (/api/asset): сервер
// GDevelop не пускает чужие сайты. Все примеры под лицензиями MIT/CC0.
// На localhost (разработка) читаем напрямую.
// В приложении страница открыта с file://, там своего /api нет: берём с сайта.
const getExamplesApiBaseUrl = (): string => {
  if (window.location.hostname === 'localhost') {
    return GDevelopAssetApi.baseUrl;
  }
  if (/^https?:$/.test(window.location.protocol)) {
    return `${window.location.origin}/api/asset`;
  }
  return 'https://voxforge.quorvox.ru/api/asset';
};

export const listAllExamples = async (): Promise<AllExamples> => {
  // $FlowFixMe[underconstrained-implicit-instantiation]
  const response = await axios.get(`${getExamplesApiBaseUrl()}/example`, {
    params: {
      // Could be changed according to the editor environment, but keep
      // reading from the "live" data for now.
      environment: 'live',
    },
  });
  const { exampleShortHeadersUrl, filtersUrl } = response.data;

  const [exampleShortHeaders, filters] = await Promise.all([
    retryIfFailed(
      { times: 2 },
      // $FlowFixMe[underconstrained-implicit-instantiation]
      async () => (await axios.get(exampleShortHeadersUrl)).data
    ),
    // $FlowFixMe[underconstrained-implicit-instantiation]
    retryIfFailed({ times: 2 }, async () => (await axios.get(filtersUrl)).data),
  ]);

  const allExamples: AllExamples = {
    exampleShortHeaders,
    filters,
  };

  return allExamples;
};

export const getExample = async (
  exampleShortHeader: ExampleShortHeader
): Promise<Example> => {
  // $FlowFixMe[underconstrained-implicit-instantiation]
  const response = await axios.get(
    `${getExamplesApiBaseUrl()}/example-v2/${exampleShortHeader.id}`
  );

  return response.data;
};

export const getUserExampleShortHeaders = async (
  authorId: string
): Promise<Array<ExampleShortHeader>> => {
  // $FlowFixMe[underconstrained-implicit-instantiation]
  const response = await axios.get(
    `${GDevelopAssetApi.baseUrl}/example-short-header`,
    {
      params: {
        authorId,
      },
    }
  );

  return response.data;
};
