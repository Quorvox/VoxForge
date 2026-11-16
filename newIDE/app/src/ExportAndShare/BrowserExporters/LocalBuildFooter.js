// @flow
// VoxForge: сборка APK и EXE через локальный сборщик (voxforge-builder).
// Редактор экспортирует проект в zip (Cordova или Electron), отправляет его
// сборщику на этом же компьютере и скачивает готовый файл.
import * as React from 'react';
import Text from '../../UI/Text';
import { Column, Line } from '../../UI/Grid';
import RaisedButton from '../../UI/RaisedButton';
import FlatButton from '../../UI/FlatButton';
import {
  BlobDownloadUrlHolder,
  openBlobDownloadUrl,
} from '../../Utils/BlobDownloadUrlHolder';

const BUILDER_URL = 'http://127.0.0.1:3060';

export type LocalBuildKind = 'android' | 'windows';

type BuilderTools = {
  node: boolean,
  npm: boolean,
  jdk17: boolean,
  androidSdk: boolean,
};

type Phase =
  | {| name: 'checking' |}
  | {| name: 'no-builder' |}
  | {| name: 'missing-tools', tools: BuilderTools |}
  | {| name: 'ready' |}
  | {| name: 'building', step: string, log: string |}
  | {| name: 'done', blob: Blob, fileName: string |}
  | {| name: 'error', message: string, log: string |};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getMissingTools = (kind: LocalBuildKind, tools: BuilderTools): boolean =>
  !tools.node ||
  !tools.npm ||
  (kind === 'android' && (!tools.jdk17 || !tools.androidSdk));

type Props = {|
  kind: LocalBuildKind,
  /** zip с экспортом игры. */
  zipBlob: Blob,
  appName: string,
|};

const LocalBuildFooter = ({ kind, zipBlob, appName }: Props): React.Node => {
  const [phase, setPhase] = React.useState<Phase>({ name: 'checking' });
  const isMounted = React.useRef(true);
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkBuilder = React.useCallback(
    async () => {
      setPhase({ name: 'checking' });
      try {
        const response = await fetch(`${BUILDER_URL}/status`);
        const { tools } = await response.json();
        if (!isMounted.current) return;
        setPhase(
          getMissingTools(kind, tools)
            ? { name: 'missing-tools', tools }
            : { name: 'ready' }
        );
      } catch (error) {
        if (isMounted.current) setPhase({ name: 'no-builder' });
      }
    },
    [kind]
  );
  React.useEffect(
    () => {
      checkBuilder();
    },
    [checkBuilder]
  );

  const startBuild = async () => {
    setPhase({ name: 'building', step: 'Отправка проекта сборщику', log: '' });
    try {
      const response = await fetch(`${BUILDER_URL}/build/${kind}`, {
        method: 'POST',
        body: zipBlob,
        headers: { 'X-App-Name': encodeURIComponent(appName) },
      });
      const { id } = await response.json();
      for (;;) {
        await sleep(3000);
        if (!isMounted.current) return;
        const job = await (await fetch(`${BUILDER_URL}/job/${id}`)).json();
        if (job.status === 'running') {
          setPhase({ name: 'building', step: job.step, log: job.log });
          continue;
        }
        if (job.status === 'error') {
          setPhase({
            name: 'error',
            message: job.error || 'Сборка не удалась.',
            log: job.log,
          });
          return;
        }
        const fileResponse = await fetch(`${BUILDER_URL}/job/${id}/file`);
        const blob = await fileResponse.blob();
        setPhase({
          name: 'done',
          blob,
          fileName: `${appName || 'game'}.${
            kind === 'android' ? 'apk' : 'exe'
          }`,
        });
        return;
      }
    } catch (error) {
      if (isMounted.current)
        setPhase({
          name: 'error',
          message: 'Потеряна связь со сборщиком. Он запущен?',
          log: '',
        });
    }
  };

  const label = kind === 'android' ? 'APK' : 'EXE';

  return (
    <Column noMargin alignItems="center">
      {phase.name === 'checking' && (
        <Text>Ищу сборщик на этом компьютере…</Text>
      )}

      {phase.name === 'no-builder' && (
        <Column alignItems="center">
          <Text align="center">
            Сборщик не запущен. Он собирает {label} прямо на твоём компьютере.
            Запусти файл <b>voxforge-builder\start-builder.bat</b> и нажми
            «Проверить снова».
          </Text>
          <FlatButton label="Проверить снова" onClick={checkBuilder} />
        </Column>
      )}

      {phase.name === 'missing-tools' && (
        <Column alignItems="center">
          <Text align="center">
            Сборщик запущен, но не хватает инструментов:{' '}
            {[
              !phase.tools.node && 'Node.js',
              !phase.tools.npm && 'npm',
              kind === 'android' && !phase.tools.jdk17 && 'JDK 17',
              kind === 'android' && !phase.tools.androidSdk && 'Android SDK',
            ]
              .filter(Boolean)
              .join(', ')}
            .
          </Text>
          <FlatButton label="Проверить снова" onClick={checkBuilder} />
        </Column>
      )}

      {phase.name === 'ready' && (
        <Column alignItems="center">
          <Text align="center">
            Проект экспортирован. Теперь соберём {label} на этом компьютере.
          </Text>
          <RaisedButton
            primary
            label={`Собрать ${label}`}
            onClick={startBuild}
          />
        </Column>
      )}

      {phase.name === 'building' && (
        <Column alignItems="center">
          <Text>{phase.step}…</Text>
          <Text size="body-small" color="secondary">
            Первая сборка занимает несколько минут: скачиваются инструменты.
          </Text>
          {phase.log && (
            <pre
              style={{
                maxHeight: 140,
                maxWidth: 560,
                overflow: 'auto',
                fontSize: 11,
                opacity: 0.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {phase.log.slice(-900)}
            </pre>
          )}
        </Column>
      )}

      {phase.name === 'done' && (
        <Column alignItems="center">
          <Text>Готово! Файл {phase.fileName} собран.</Text>
          <Line justifyContent="center">
            <BlobDownloadUrlHolder blob={phase.blob}>
              {url => (
                <RaisedButton
                  primary
                  label={`Скачать ${label}`}
                  onClick={() => openBlobDownloadUrl(url, phase.fileName)}
                />
              )}
            </BlobDownloadUrlHolder>
          </Line>
          {kind === 'android' && (
            <Text size="body-small" color="secondary" align="center">
              Это отладочная сборка: она ставится на телефон напрямую. Для
              Google Play понадобится подпись.
            </Text>
          )}
        </Column>
      )}

      {phase.name === 'error' && (
        <Column alignItems="center">
          <Text color="error" align="center">
            {phase.message}
          </Text>
          {phase.log && (
            <pre
              style={{
                maxHeight: 160,
                maxWidth: 560,
                overflow: 'auto',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
              }}
            >
              {phase.log.slice(-1500)}
            </pre>
          )}
          <FlatButton label="Попробовать снова" onClick={checkBuilder} />
        </Column>
      )}
    </Column>
  );
};

export default LocalBuildFooter;
