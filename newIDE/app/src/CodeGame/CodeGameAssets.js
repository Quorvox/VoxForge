// @flow
// VoxForge: вкладки «Спрайты», «Звуки», «Музыка» у код-игры: просмотр,
// добавление файлов (кнопкой или перетаскиванием), удаление, настройки
// анимации спрайта и своя мини-рисовалка.
import * as React from 'react';
import { C, ConfirmBox, Ico, sharedButtons } from './CodeGameParts';
import SpriteEditor from './CodeGameSpriteEditor';
import {
  ASSET_ACCEPT,
  type AssetFolder,
  type CodeGame,
  deleteAssetFile,
  getSpriteProps,
  importAssetFiles,
  listAssets,
  readAssetUrl,
  setSpriteProps,
} from './CodeGameFiles';

const { buttonStyle, primaryStyle, inputStyle } = sharedButtons;

const TITLES: { [folder: string]: string } = {
  sprites: 'Спрайты',
  sounds: 'Звуки',
  music: 'Музыка',
};

const FORMATS: { [folder: string]: string } = {
  sprites: 'PNG или JPG',
  sounds: 'WAV, MP3 или OGG',
  music: 'MP3, OGG или WAV',
};

const styles: { [string]: Object } = {
  wrap: { display: 'flex', gap: 12, flex: 1, minHeight: 0 },
  grid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
    gap: 8,
    alignContent: 'start',
    padding: 8,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    background: C.panel,
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    border: '1px solid transparent',
    borderRadius: 6,
    background: 'transparent',
    color: C.text,
    font: 'inherit',
    cursor: 'pointer',
  },
  cellSelected: { borderColor: C.accent, background: C.panel2 },
  thumb: {
    width: 64,
    height: 64,
    objectFit: 'contain',
    imageRendering: 'pixelated',
    background:
      'repeating-conic-gradient(rgba(128,128,128,0.18) 0% 25%, transparent 0% 50%) 50% / 12px 12px',
  },
  name: {
    fontSize: 11,
    maxWidth: 88,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  side: {
    width: 270,
    flexShrink: 0,
    padding: 12,
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    background: C.panel,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    width: '100%',
    gap: 8,
    alignItems: 'center',
    padding: '7px 12px',
    border: 'none',
    background: 'transparent',
    color: C.text,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  preview: {
    maxWidth: '100%',
    maxHeight: 220,
    imageRendering: 'pixelated',
    background:
      'repeating-conic-gradient(rgba(128,128,128,0.18) 0% 25%, transparent 0% 50%) 50% / 16px 16px',
  },
};

const formatSize = (bytes: number): string =>
  bytes < 1024 ? `${bytes} Б` : `${(bytes / 1024).toFixed(1)} КБ`;

const stripExtension = (name: string): string => name.replace(/\.[^.]+$/, '');

type Props = {|
  directory: any,
  folder: AssetFolder,
  game: CodeGame,
  /** Файлы поменялись: пора обновить список ресурсов и сохранить. */
  onChanged: (changed: Array<string>) => Promise<void>,
  onHtmlChanged: (html: string) => void,
|};

const CodeGameAssets = ({
  directory,
  folder,
  game,
  onChanged,
  onHtmlChanged,
}: Props): React.Node => {
  const [names, setNames] = React.useState<Array<string>>([]);
  const [urls, setUrls] = React.useState<{ [name: string]: string }>({});
  const [selected, setSelected] = React.useState<?string>(null);
  const [selectedInfo, setSelectedInfo] = React.useState<?{|
    url: string,
    size: number,
    width: number,
    height: number,
  |}>(null);
  const [reload, setReload] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const [editor, setEditor] = React.useState<?{|
    name: string,
    url: ?string,
  |}>(null);
  const [deleting, setDeleting] = React.useState<?string>(null);
  const [frames, setFrames] = React.useState(1);
  const [fps, setFps] = React.useState(5);
  const fileInput = React.useRef<?HTMLInputElement>(null);
  const isImage = folder === 'sprites';

  React.useEffect(
    () => {
      let cancelled = false;
      const created = [];
      setUrls({});
      (async () => {
        const list = await listAssets(directory, folder);
        if (cancelled) return;
        setNames(list);
        if (!isImage) return;
        // Миниатюры подгружаем порциями, чтобы вкладка открывалась сразу.
        for (let i = 0; i < list.length && !cancelled; i += 20) {
          const part = await Promise.all(
            list.slice(i, i + 20).map(async name => {
              const { url } = await readAssetUrl(directory, folder, name);
              created.push(url);
              return [name, url];
            })
          );
          if (cancelled) return;
          setUrls(previous => ({ ...previous, ...Object.fromEntries(part) }));
        }
      })();
      return () => {
        cancelled = true;
        created.forEach(url => URL.revokeObjectURL(url));
      };
    },
    [directory, folder, isImage, reload]
  );

  React.useEffect(
    () => {
      setSelected(null);
      setSelectedInfo(null);
      setMessage('');
    },
    [folder, directory]
  );

  const choose = async (name: string) => {
    setSelected(name);
    const { url, size } = await readAssetUrl(directory, folder, name);
    if (isImage) {
      const props = getSpriteProps(game.html, name);
      setFrames(props.frames);
      setFps(props.fps);
      const image = new Image();
      image.onload = () =>
        setSelectedInfo({ url, size, width: image.width, height: image.height });
      image.src = url;
    } else {
      setSelectedInfo({ url, size, width: 0, height: 0 });
    }
  };

  const addFiles = async (files: Array<File>) => {
    if (!files.length) return;
    try {
      const added = await importAssetFiles(directory, (folder: any), files);
      if (!added.length) {
        setMessage(`Подходят только файлы: ${FORMATS[folder]}.`);
        return;
      }
      await onChanged(added.map(name => `${folder}/${name}`));
      setReload(r => r + 1);
      setMessage(
        added.length === 1
          ? `Добавлено: ${added[0]}`
          : `Добавлено файлов: ${added.length}`
      );
    } catch (e) {
      setMessage((e && e.message) || 'Не получилось добавить файлы.');
    }
  };

  const removeSelected = async () => {
    const name = deleting;
    setDeleting(null);
    if (!name) return;
    try {
      await deleteAssetFile(directory, (folder: any), name);
      await onChanged([]);
      setSelected(null);
      setSelectedInfo(null);
      setReload(r => r + 1);
    } catch (e) {
      setMessage((e && e.message) || 'Не получилось удалить файл.');
    }
  };

  const saveSprite = async (name: string, blob: Blob) => {
    const file = new File([blob], `${name}.png`, { type: 'image/png' });
    await importAssetFiles(directory, 'sprites', [file]);
    await onChanged([`sprites/${name}.png`]);
    setEditor(null);
    setReload(r => r + 1);
    setSelected(null);
    setSelectedInfo(null);
    setMessage(`Спрайт «${name}» сохранён`);
  };

  const applySpriteProps = (nextFrames: number, nextFps: number) => {
    if (!selected) return;
    onHtmlChanged(
      setSpriteProps(game.html, selected, { frames: nextFrames, fps: nextFps })
    );
  };

  const dropProps = {
    onDragOver: (event: any) => {
      event.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (event: any) => {
      event.preventDefault();
      setDragOver(false);
      addFiles(Array.from(event.dataTransfer.files || []));
    },
  };

  const kindIcon = isImage ? 'sprites' : folder === 'sounds' ? 'sounds' : 'music';
  const kindWord =
    folder === 'sprites' ? 'спрайтов' : folder === 'sounds' ? 'звуков' : 'музыки';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginRight: 6 }}>
          {TITLES[folder]} {names.length ? `· ${names.length}` : ''}
        </div>
        <button
          type="button"
          style={{
            ...primaryStyle,
            padding: '6px 14px',
            display: 'inline-flex',
            gap: 6,
            alignItems: 'center',
          }}
          onClick={() => fileInput.current && fileInput.current.click()}
        >
          <Ico name="plus" size={15} /> Добавить файлы
        </button>
        {isImage ? (
          <button
            type="button"
            style={{
              ...buttonStyle,
              padding: '6px 14px',
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
            }}
            onClick={() => setEditor({ name: '', url: null })}
          >
            <Ico name="edit" size={15} /> Нарисовать спрайт
          </button>
        ) : null}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ASSET_ACCEPT[folder]}
          style={{ display: 'none' }}
          onChange={event => {
            addFiles(Array.from(event.target.files || []));
            event.target.value = '';
          }}
        />
        <div style={{ flex: 1 }} />
        {message ? <span style={{ color: C.dim, fontSize: 13 }}>{message}</span> : null}
      </div>

      {!names.length ? (
        <div
          {...dropProps}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            border: `2px dashed ${dragOver ? C.accent : C.line}`,
            borderRadius: 10,
            color: C.dim,
            textAlign: 'center',
            padding: 24,
          }}
        >
          <Ico name={kindIcon} size={40} />
          <div style={{ color: C.text, fontSize: 15 }}>
            В этой игре пока нет {kindWord}
          </div>
          <div>
            Перетащи файлы сюда или нажми «Добавить файлы». Подходят: {FORMATS[folder]}.
          </div>
          {isImage ? <div>Можно и нарисовать свой спрайт прямо здесь.</div> : null}
        </div>
      ) : (
        <div style={styles.wrap}>
          {isImage ? (
            <div
              {...dropProps}
              style={{ ...styles.grid, borderColor: dragOver ? C.accent : C.line }}
            >
              {names.map(name => (
                <button
                  key={name}
                  type="button"
                  style={{
                    ...styles.cell,
                    ...(name === selected ? styles.cellSelected : {}),
                  }}
                  onClick={() => choose(name)}
                  title={name}
                >
                  {urls[name] ? (
                    <img src={urls[name]} alt={name} style={styles.thumb} />
                  ) : (
                    <div style={styles.thumb} />
                  )}
                  <span style={styles.name}>{stripExtension(name)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div
              {...dropProps}
              style={{
                ...styles.grid,
                display: 'block',
                padding: 4,
                borderColor: dragOver ? C.accent : C.line,
              }}
            >
              {names.map(name => (
                <button
                  key={name}
                  type="button"
                  style={{
                    ...styles.row,
                    ...(name === selected ? styles.cellSelected : {}),
                  }}
                  onClick={() => choose(name)}
                >
                  <Ico name={kindIcon} size={16} />
                  {name}
                </button>
              ))}
            </div>
          )}
          <div style={styles.side}>
            {selected && selectedInfo ? (
              <>
                <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{selected}</div>
                <div style={{ color: C.dim, fontSize: 12 }}>
                  {formatSize(selectedInfo.size)}
                  {isImage ? ` · ${selectedInfo.width}×${selectedInfo.height}` : ''}
                </div>
                {isImage ? (
                  <>
                    <img src={selectedInfo.url} alt={selected} style={styles.preview} />
                    <div style={{ color: C.dim, fontSize: 12 }}>
                      В коде: screen.drawSprite("{stripExtension(selected)}", 0, 0, 32)
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ flex: 1, fontSize: 12, color: C.dim }}>
                        Кадров
                        <input
                          type="number"
                          min={1}
                          style={{ ...inputStyle, marginTop: 3 }}
                          value={frames}
                          onChange={event => {
                            const value = Math.max(1, Number(event.target.value) || 1);
                            setFrames(value);
                            applySpriteProps(value, fps);
                          }}
                        />
                      </label>
                      <label style={{ flex: 1, fontSize: 12, color: C.dim }}>
                        Кадров в секунду
                        <input
                          type="number"
                          min={1}
                          style={{ ...inputStyle, marginTop: 3 }}
                          value={fps}
                          onChange={event => {
                            const value = Math.max(1, Number(event.target.value) || 1);
                            setFps(value);
                            applySpriteProps(frames, value);
                          }}
                        />
                      </label>
                    </div>
                    <div style={{ color: C.faint, fontSize: 12 }}>
                      Кадры анимации лежат в картинке друг под другом.
                    </div>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() =>
                        setEditor({
                          name: stripExtension(selected),
                          url: selectedInfo.url,
                        })
                      }
                    >
                      Редактировать в рисовалке
                    </button>
                  </>
                ) : (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <audio key={selectedInfo.url} src={selectedInfo.url} controls autoPlay />
                    <div style={{ color: C.dim, fontSize: 12 }}>
                      В коде: audio.{folder === 'sounds' ? 'playSound' : 'playMusic'}("
                      {stripExtension(selected)}")
                    </div>
                  </>
                )}
                <button
                  type="button"
                  style={{ ...buttonStyle, color: C.danger }}
                  onClick={() => setDeleting(selected)}
                >
                  Удалить из игры
                </button>
              </>
            ) : (
              <div style={{ color: C.dim }}>Выбери файл слева.</div>
            )}
          </div>
        </div>
      )}
      {editor ? (
        <SpriteEditor
          key={editor.url || 'new'}
          initialName={editor.name}
          initialUrl={editor.url}
          onSave={saveSprite}
          onCancel={() => setEditor(null)}
        />
      ) : null}
      {deleting ? (
        <ConfirmBox
          title="Удалить файл?"
          text={`«${deleting}» пропадёт из папки игры. Это нельзя отменить.`}
          okLabel="Удалить"
          danger
          onOk={removeSelected}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
};

export default CodeGameAssets;
