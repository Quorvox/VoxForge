// @flow
// VoxForge: «Код-игра» — полноэкранное рабочее пространство для игр на
// microScript (microStudio): слева разделы, файлы, редактор со вкладками,
// справа запуск игры и консоль.
import * as React from 'react';
import ReactDOM from 'react-dom';
import { CodeEditor } from '../CodeEditor';
import CodeGameAssets from './CodeGameAssets';
import GDevelopGLogo from '../UI/CustomSvgIcons/GDevelopGLogo';
import {
  type CodeGame,
  buildCodeGameHtml,
  injectConsoleBridge,
  isDesktopApp,
  parseCodeGame,
  pickGameFolderDesktop,
  readIndexHtml,
  stageCodeGameForRun,
  writeIndexHtml,
} from './CodeGameFiles';

type Section = 'code' | 'sprites' | 'sounds' | 'music';

const RAIL: Array<{|
  id: string,
  label: string,
  icon: string,
  section: ?Section,
|}> = [
  {
    id: 'code',
    label: 'Код',
    icon: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
    section: 'code',
  },
  {
    id: 'sprites',
    label: 'Спрайты',
    icon: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4',
    section: 'sprites',
  },
  {
    id: 'maps',
    label: 'Карты',
    icon: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
    section: null,
  },
  {
    id: 'sounds',
    label: 'Звуки',
    icon: 'M4 9v6h4l5 4V5L8 9zM16 8a5 5 0 010 8',
    section: 'sounds',
  },
  {
    id: 'music',
    label: 'Музыка',
    icon:
      'M9 18V6l10-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM19 16a3 3 0 11-6 0 3 3 0 016 0z',
    section: 'music',
  },
  {
    id: 'docs',
    label: 'Документ',
    icon: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
    section: null,
  },
];

const C = {
  bg: '#0d0b09',
  panel: '#14110e',
  panel2: '#1a1611',
  line: 'rgba(255,255,255,0.08)',
  text: '#f4ede5',
  dim: '#9b8f84',
  accent: 'var(--theme-primary-color, #ff8a3d)',
};

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 1450,
    display: 'flex',
    flexDirection: 'column',
    background: C.bg,
    color: C.text,
    fontFamily: 'var(--gdevelop-modern-font-family)',
    fontSize: 14,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    height: 46,
    padding: '0 14px',
    background: C.panel,
    borderBottom: `1px solid ${C.line}`,
    flexShrink: 0,
    WebkitAppRegion: 'drag',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    height: 24,
    padding: '0 12px',
    background: C.panel,
    borderTop: `1px solid ${C.line}`,
    color: C.dim,
    fontSize: 12,
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Unbounded', var(--gdevelop-modern-font-family)",
    fontWeight: 600,
    fontSize: 15,
  },
  btn: {
    padding: '6px 14px',
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    background: C.panel2,
    color: C.text,
    font: 'inherit',
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag',
  },
  btnPrimary: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 6,
    background: C.accent,
    color: '#1a0f06',
    font: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    WebkitAppRegion: 'no-drag',
  },
  body: { flex: 1, display: 'flex', minHeight: 0 },
  rail: {
    width: 76,
    flexShrink: 0,
    background: C.panel,
    borderRight: `1px solid ${C.line}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
    gap: 2,
  },
  railBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '10px 0',
    border: 'none',
    background: 'transparent',
    color: C.dim,
    font: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
  },
  railBtnActive: {
    color: C.text,
    borderLeft: `3px solid ${C.accent}`,
    background: C.panel2,
  },
  side: {
    width: 230,
    flexShrink: 0,
    background: C.panel,
    borderRight: `1px solid ${C.line}`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  search: {
    margin: 8,
    padding: '7px 10px',
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    background: C.bg,
    color: C.text,
    font: 'inherit',
    outline: 'none',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: C.text,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  fileRowActive: {
    background: C.panel2,
    boxShadow: `inset 3px 0 0 ${C.accent}`,
  },
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  tabs: {
    display: 'flex',
    background: C.panel,
    borderBottom: `1px solid ${C.line}`,
    overflowX: 'auto',
    flexShrink: 0,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    border: 'none',
    borderRight: `1px solid ${C.line}`,
    background: 'transparent',
    color: C.dim,
    font: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: C.text,
    background: C.bg,
    boxShadow: `inset 0 2px 0 ${C.accent}`,
  },
  run: {
    width: '42%',
    minWidth: 320,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `1px solid ${C.line}`,
    background: C.panel,
  },
  runBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 40,
    padding: '0 10px',
    borderBottom: `1px solid ${C.line}`,
    flexShrink: 0,
  },
  console: {
    height: 170,
    flexShrink: 0,
    borderTop: `1px solid ${C.line}`,
    overflowY: 'auto',
    padding: '6px 10px',
    fontFamily: '"Lucida Console", Monaco, monospace',
    fontSize: 12,
    background: C.bg,
  },
};

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M2 1l9 5-9 5z" />
  </svg>
);

const Icon = ({ path }: {| path: string |}) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);

type LogLine = {| type: string, text: string, key: number |};

type Props = {| onClose: () => void |};

const CodeGameWorkspace = ({ onClose }: Props): React.Node => {
  const [handle, setHandle] = React.useState<any>(null);
  const [game, setGame] = React.useState<?CodeGame>(null);
  const [section, setSection] = React.useState<Section>('code');
  const [openTabs, setOpenTabs] = React.useState<Array<string>>([]);
  const [active, setActive] = React.useState<?string>(null);
  const [filter, setFilter] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [runUrl, setRunUrl] = React.useState<?string>(null);
  const [runKey, setRunKey] = React.useState(0);
  const [runWidth, setRunWidth] = React.useState(
    Math.round(window.innerWidth * 0.42)
  );
  const [logs, setLogs] = React.useState<Array<LogLine>>([]);
  const [revision, setRevision] = React.useState(0);
  const [isBusy, setIsBusy] = React.useState(false);
  const [editorSize, setEditorSize] = React.useState({
    width: 700,
    height: 500,
  });
  const editorBox = React.useRef<?HTMLDivElement>(null);
  const logCounter = React.useRef(0);
  const consoleEnd = React.useRef<?HTMLDivElement>(null);

  // Размер редактора подгоняем под свободное место.
  React.useEffect(
    () => {
      const element = editorBox.current;
      if (!element) return;
      const update = () =>
        setEditorSize({
          width: Math.max(300, element.clientWidth - 2),
          height: Math.max(200, element.clientHeight - 2),
        });
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    },
    [game, section, runUrl, openTabs.length]
  );

  // Консоль игры: сообщения приходят из окна игры.
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data: any = event.data;
      if (!data || !data.__vf) return;
      logCounter.current += 1;
      setLogs(previous =>
        [
          ...previous,
          { type: data.type, text: data.text, key: logCounter.current },
        ].slice(-300)
      );
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  React.useEffect(
    () => {
      if (consoleEnd.current)
        consoleEnd.current.scrollIntoView({ block: 'end' });
    },
    [logs.length]
  );

  const openFile = (name: string) => {
    setSection('code');
    setOpenTabs(tabs => (tabs.includes(name) ? tabs : [...tabs, name]));
    setActive(name);
  };

  const closeTab = (name: string) => {
    setOpenTabs(tabs => {
      const next = tabs.filter(tab => tab !== name);
      if (active === name)
        setActive(next.length ? next[next.length - 1] : null);
      return next;
    });
  };

  const openFolder = async () => {
    setMessage('');
    try {
      let directory;
      if (isDesktopApp()) {
        directory = await pickGameFolderDesktop();
        if (!directory) return;
      } else {
        if (typeof window.showDirectoryPicker !== 'function') {
          setMessage(
            'Этот браузер не умеет открывать папки. Открой в Chrome или Edge, либо поставь десктопную версию.'
          );
          return;
        }
        directory = await window.showDirectoryPicker({
          id: 'voxforge-codegame',
          mode: 'readwrite',
        });
      }
      const html = await readIndexHtml(directory);
      const parsed = parseCodeGame(html);
      setHandle(directory);
      setGame(parsed);
      if (parsed.files.length) {
        setOpenTabs([parsed.files[0].name]);
        setActive(parsed.files[0].name);
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      setMessage((error && error.message) || 'Не получилось открыть папку.');
    }
  };

  const activeFile = game && game.files.find(file => file.name === active);
  const isDirty =
    !!game && game.files.some(file => file.text !== file.original);

  const save = async () => {
    if (!game || !handle) return;
    setIsBusy(true);
    try {
      const html = buildCodeGameHtml(game);
      await writeIndexHtml(handle, html);
      game.files.forEach(file => {
        file.original = file.text;
      });
      game.html = html;
      setMessage('Сохранено. Копия исходной игры: index.html.original.');
      setRevision(r => r + 1);
    } catch (error) {
      setMessage((error && error.message) || 'Не получилось сохранить.');
    }
    setIsBusy(false);
  };

  const run = async () => {
    if (!game || !handle) return;
    setIsBusy(true);
    setLogs([]);
    try {
      const url = await stageCodeGameForRun(
        handle,
        injectConsoleBridge(buildCodeGameHtml(game))
      );
      setRunUrl(url);
      setRunKey(k => k + 1);
    } catch (error) {
      setMessage((error && error.message) || 'Не получилось запустить игру.');
    }
    setIsBusy(false);
  };

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
      if (event.key === 'F5') {
        event.preventDefault();
        run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const requestClose = () => {
    if (
      isDirty &&
      !window.confirm('Есть несохранённые правки. Выйти без сохранения?')
    ) {
      return;
    }
    onClose();
  };

  React.useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  });

  const filteredFiles = game
    ? game.files.filter(file =>
        file.name.toLowerCase().includes(filter.trim().toLowerCase())
      )
    : [];

  const content = (
    <div style={styles.root} role="dialog" aria-label="Код-игра">
      <div
        style={{
          ...styles.header,
          // В приложении справа рисуются кнопки окна: оставляем им место.
          paddingRight: isDesktopApp() ? 150 : 14,
        }}
      >
        <button
          type="button"
          style={{ ...styles.btn, padding: '5px 12px' }}
          onClick={requestClose}
          title="Esc"
        >
          ← В меню
        </button>
        <GDevelopGLogo style={{ width: 24, height: 24 }} />
        <span style={styles.title}>{game ? game.title : 'Код-игра'}</span>
        <span style={{ color: C.dim, fontSize: 12 }}>microScript</span>
        <div style={{ flex: 1 }} />
        {message ? (
          <span style={{ color: C.dim, fontSize: 12, marginRight: 8 }}>
            {message}
          </span>
        ) : null}
        {game ? (
          <>
            <button
              type="button"
              style={styles.btn}
              disabled={isBusy}
              onClick={save}
            >
              {isDirty ? 'Сохранить *' : 'Сохранить'}{' '}
              <span style={{ color: C.dim }}>Ctrl+S</span>
            </button>
            <button
              type="button"
              style={styles.btnPrimary}
              disabled={isBusy}
              onClick={run}
            >
              <PlayIcon /> Запуск
            </button>
          </>
        ) : null}
      </div>

      {!game ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ ...styles.title, fontSize: 22 }}>
            Открой игру microStudio
          </div>
          <div style={{ color: C.dim, maxWidth: 460, textAlign: 'center' }}>
            Выбери папку игры (в ней лежит index.html). Код, спрайты и звуки
            откроются как в microStudio, игру можно запускать прямо здесь.
          </div>
          <button
            type="button"
            style={{ ...styles.btnPrimary, padding: '10px 22px' }}
            onClick={openFolder}
          >
            Выбрать папку игры…
          </button>
          {message ? (
            <div
              style={{ color: '#ff8a7a', maxWidth: 520, textAlign: 'center' }}
            >
              {message}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={styles.body}>
          <div style={styles.rail}>
            {RAIL.map(item => (
              <button
                key={item.id}
                type="button"
                title={item.section ? item.label : `${item.label}: скоро`}
                disabled={!item.section}
                style={{
                  ...styles.railBtn,
                  ...(item.section === section ? styles.railBtnActive : {}),
                  opacity: item.section ? 1 : 0.35,
                  cursor: item.section ? 'pointer' : 'default',
                }}
                onClick={() => item.section && setSection(item.section)}
              >
                <Icon path={item.icon} />
                {item.label}
              </button>
            ))}
          </div>

          {section === 'code' ? (
            <div style={styles.side}>
              <input
                style={styles.search}
                placeholder="Поиск файла…"
                value={filter}
                onChange={event => setFilter(event.target.value)}
              />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredFiles.map(file => (
                  <button
                    key={file.name}
                    type="button"
                    style={{
                      ...styles.fileRow,
                      ...(file.name === active ? styles.fileRowActive : {}),
                    }}
                    onClick={() => openFile(file.name)}
                  >
                    <span style={{ color: C.dim }}>▸</span>
                    {file.name.replace(/\.ms$/, '')}
                    {file.text !== file.original ? (
                      <span style={{ color: C.accent }}> ●</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div style={styles.main}>
            {section === 'code' ? (
              <>
                <div style={styles.tabs}>
                  {openTabs.map(name => (
                    <button
                      key={name}
                      type="button"
                      style={{
                        ...styles.tab,
                        ...(name === active ? styles.tabActive : {}),
                      }}
                      onClick={() => setActive(name)}
                    >
                      {name.replace(/\.ms$/, '')}
                      <span
                        role="button"
                        tabIndex={0}
                        style={{ color: C.dim }}
                        onClick={event => {
                          event.stopPropagation();
                          closeTab(name);
                        }}
                        onKeyDown={() => {}}
                      >
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, minHeight: 0 }} ref={editorBox}>
                  {activeFile ? (
                    <CodeEditor
                      key={activeFile.name}
                      language="lua"
                      value={activeFile.text}
                      onChange={(text: string) => {
                        activeFile.text = text;
                        setRevision(r => r + 1);
                      }}
                      initialScrollTop={0}
                      initialCursorColumn={0}
                      initialCursorLine={0}
                      saveEditorState={() => {}}
                      width={editorSize.width}
                      height={editorSize.height}
                      onFocus={() => {}}
                      onBlur={() => {}}
                    />
                  ) : (
                    <div style={{ padding: 24, color: C.dim }}>
                      Выбери файл слева.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, minHeight: 0, padding: 10 }}>
                <CodeGameAssets directory={handle} folder={section} />
              </div>
            )}
          </div>

          <div
            title="Потяни, чтобы изменить ширину"
            style={{
              width: 5,
              cursor: 'col-resize',
              background: C.line,
              flexShrink: 0,
            }}
            onMouseDown={(event: any) => {
              event.preventDefault();
              const startX = event.clientX;
              const startWidth = runWidth;
              const onMove = (moveEvent: MouseEvent) =>
                setRunWidth(
                  Math.min(
                    window.innerWidth - 500,
                    Math.max(320, startWidth + (startX - moveEvent.clientX))
                  )
                );
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
          <div style={{ ...styles.run, width: runWidth }}>
            <div style={styles.runBar}>
              <span style={{ fontWeight: 600 }}>Запуск</span>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                style={styles.btn}
                onClick={run}
                disabled={isBusy}
                title="F5"
              >
                ⟳ Перезапуск
              </button>
              <button
                type="button"
                style={styles.btn}
                onClick={() => setRunUrl(null)}
                disabled={!runUrl}
              >
                ■ Стоп
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: '#000' }}>
              {runUrl ? (
                <iframe
                  key={runKey}
                  title="Игра"
                  src={runUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; gamepad"
                />
              ) : (
                <div style={{ padding: 20, color: C.dim }}>
                  Нажми «Запуск» (F5), игра появится здесь.
                </div>
              )}
            </div>
            <div style={styles.console}>
              <div style={{ color: C.dim, marginBottom: 4 }}>
                Консоль{' '}
                <button
                  type="button"
                  style={{
                    ...styles.btn,
                    padding: '0 8px',
                    marginLeft: 6,
                    fontSize: 11,
                  }}
                  onClick={() => setLogs([])}
                >
                  очистить
                </button>
              </div>
              {logs.map(line => (
                <div
                  key={line.key}
                  style={{
                    color:
                      line.type === 'error'
                        ? '#ff7a6a'
                        : line.type === 'warn'
                        ? '#ffcf6a'
                        : C.text,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {line.text}
                </div>
              ))}
              <div ref={consoleEnd} />
            </div>
          </div>
        </div>
      )}
      {game ? (
        <div style={styles.status}>
          <span>microScript</span>
          <span>UTF-8</span>
          <span>
            {activeFile
              ? `${activeFile.name} · ${
                  activeFile.text.split('\n').length
                } строк`
              : 'Файл не выбран'}
          </span>
          <div style={{ flex: 1 }} />
          <span>Файлов: {game.files.length}</span>
          <span>{isDirty ? 'Есть несохранённые правки' : 'Всё сохранено'}</span>
        </div>
      ) : null}
      <span style={{ display: 'none' }}>{revision}</span>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CodeGameWorkspace;
