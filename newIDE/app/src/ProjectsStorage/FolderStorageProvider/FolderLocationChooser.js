// @flow
import * as React from 'react';
import FlatButton from '../../UI/FlatButton';
import Text from '../../UI/Text';
import { Column, Line } from '../../UI/Grid';
import { type SaveAsLocation } from '../index';
import {
  generateProjectId,
  saveDirectoryHandle,
} from '../BrowserStorageProvider/BrowserProjectDatabase';
import { vf, useVfLanguage } from '../../Utils/i18n/vfStrings';

/**
 * Выбор папки для нового проекта. Папку выбираем сразу, по клику: браузер
 * разрешает открыть окно выбора только в ответ на действие человека, а к
 * моменту сохранения (после загрузки шаблона) это «окно возможности» уже
 * закрыто.
 */
export const pickProjectFolder = async (): Promise<?SaveAsLocation> => {
  let handle;
  try {
    handle = await window.showDirectoryPicker({
      id: 'voxforge-projects',
      mode: 'readwrite',
    });
  } catch (error) {
    // Человек закрыл окно выбора — это не ошибка.
    if (error && error.name === 'AbortError') return null;
    throw error;
  }
  const id = generateProjectId();
  await saveDirectoryHandle(id, handle);
  return { fileIdentifier: id, name: handle.name };
};

type Props = {|
  saveAsLocation: ?SaveAsLocation,
  setSaveAsLocation: (?SaveAsLocation) => void,
|};

const FolderLocationChooser = ({
  saveAsLocation,
  setSaveAsLocation,
}: Props): React.Node => {
  useVfLanguage();
  const [error, setError] = React.useState<?string>(null);
  const hasFolder = !!saveAsLocation && !!saveAsLocation.fileIdentifier;

  return (
    <Column noMargin>
      <Line noMargin alignItems="center" justifyContent="space-between">
        <Text noMargin color={hasFolder ? 'primary' : 'secondary'}>
          {hasFolder && saveAsLocation
            ? `${vf('Папка')}: ${saveAsLocation.name || ''}`
            : vf('Папка не выбрана. Выбери пустую папку для проекта.')}
        </Text>
        <FlatButton
          label={hasFolder ? vf('Другая папка…') : vf('Выбрать папку…')}
          onClick={async () => {
            setError(null);
            try {
              const location = await pickProjectFolder();
              if (location) {
                setSaveAsLocation(location);
              } else {
                // Окно закрыли или Chrome не разрешил эту папку.
                setError(
                  'Папка не выбрана. Chrome не пускает в системные папки (Документы, Загрузки, Рабочий стол, диск целиком). Создай внутри пустую папку для проекта и выбери её.'
                );
              }
            } catch (e) {
              setError(
                `Не получилось выбрать папку (${(e && e.name) ||
                  'ошибка'}). Выбери другую папку, лучше новую пустую.`
              );
            }
          }}
        />
      </Line>
      {error && (
        <Text noMargin color="error" size="body-small">
          {error}
        </Text>
      )}
    </Column>
  );
};

export default FolderLocationChooser;
