// @flow

import flatten from 'lodash/flatten';
import { mapFor } from '../Utils/MapFor';
import { PYTHON_EVENT_TYPE } from './PythonEvent';
const gd: libGDevelop = global.gd;

export type EventMetadata = {|
  type: string,
  fullName: string,
  description: string,
|};

export const enumerateEventsMetadata = (): Array<EventMetadata> => {
  const allExtensions = gd
    .asPlatform(gd.JsPlatform.get())
    .getAllPlatformExtensions();

  return flatten(
    mapFor(0, allExtensions.size(), i => {
      const extension = allExtensions.at(i);
      const extensionEvents = extension.getAllEvents();

      return flatten(
        extensionEvents
          .keys()
          .toJSArray()
          .filter(type => type !== 'BuiltinAsync::Async')
          .map(type => {
            const metadata = extensionEvents.get(type);
            const item = {
              type,
              fullName: metadata.getFullName(),
              description: metadata.getDescription(),
            };
            // VoxForge: «Код Python» стоит рядом с «Код JavaScript».
            if (type === 'BuiltinCommonInstructions::JsCode') {
              return [
                item,
                {
                  type: PYTHON_EVENT_TYPE,
                  fullName: 'Код Python',
                  description: 'Python-код прямо в событии (через Pyodide).',
                },
              ];
            }
            return [item];
          })
      );
    })
  );
};
