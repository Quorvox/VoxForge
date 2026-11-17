// @flow
// VoxForge: «Код-игра». Полноэкранное рабочее пространство для игр на
// microScript (microStudio): иконки разделов слева, файлы и структура кода,
// редактор со вкладками, справа запуск игры и консоль, снизу строка состояния.
import * as React from 'react';
import ReactDOM from 'react-dom';
import CodeGameAssets from './CodeGameAssets';
import MicroScriptEditor from './MicroScriptEditor';
import GDevelopGLogo from '../UI/CustomSvgIcons/GDevelopGLogo';
import {
  AskName,
  C,
  ConfirmBox,
  ConsolePanel,
  Ico,
  OutlineList,
  PlayIcon,
  QuickOpen,
  sharedButtons,
  type LogLine,
} from './CodeGameParts';
import { getOutline, setAssetNames } from './MicroScript';
import {
  type CodeGame,
  type RecentGame,
  buildCodeGameHtml,
  createBlankGame,
  forgetRecentGame,
  injectConsoleBridge,
  isDesktopApp,
  listAssets,
  loadRecentGames,
  parseCodeGame,
  pickGameFolderDesktop,
  readIndexHtml,
  rememberGame,
  reopenRecentGame,
  stageCodeGameForRun,
  syncResourcesInHtml,
  writeIndexHtml,
} from './CodeGameFiles';

type Section = 'code' | 'sprites' | 'sounds' | 'music';

const RAIL: Array<{|
  id: string,
  label: string,
  icon: string,
  section: ?Section,
|}> = [
  { id: 'code', label: 'Код', icon: 'code', section: 'code' },
  { id: 'sprites', label: 'Спрайты', icon: 'sprites', section: 'sprites' },
  { id: 'sounds', label: 'Звуки', icon: 'sounds', section: 'sounds' },
  { id: 'music', label: 'Музыка', icon: 'music', section: 'music' },
  { id: 'maps', label: 'Карты', icon: 'maps', section: null },
  { id: 'docs', label: 'Документы', icon: 'docs', section: null },
];

const { buttonStyle, primaryStyle, inputStyle } = sharedButtons;

const noDrag: Object = { WebkitAppRegion: 'no-drag' };

const styles: { [string]: Object } = {
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
  title: {
    fontFamily: "'Unbounded', var(--gdevelop-modern-font-family)",
    fontWeight: 600,
    fontSize: 15,
  },
  btn: { ...buttonStyle, padding: '6px 12px', ...noDrag },
  btnPrimary: {
    ...primaryStyle,
    padding: '6px 16px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    ...noDrag,
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    border: `1px solid ${C.line}`,
    borderRadius: 7,
    background: C.panel2,
    color: C.text,
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  },
  body: { flex: 1, display: 'flex', minHeight: 0 },
  rail: {
    width: 56,
    flexShrink: 0,
    background: C.panel,
    borderRight: `1px solid ${C.line}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
    gap: 2,
    alignItems: 'center',
  },
  railBtn: {
    position: 'relative',
    width: 56,
    height: 46,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    color: C.dim,
    cursor: 'pointer',
  },
  side: {
    width: 250,
    flexShrink: 0,
    background: C.panel,
    borderRight: `1px solid ${C.line}`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 12px 6px',
    color: C.dim,
    fontSize: 12,
    fontWeight: 600,
  },
  tinyBtn: {
    display: 'inline-flex',
    border: 'none',
    background: 'transparent',
    color: C.dim,
    padding: 3,
    borderRadius: 5,
    cursor: 'pointer',
  },
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  tabs: {
    display: 'flex',
    background: C.panel,
    borderBottom: `1px solid ${C.line}`,
    overflowX: 'auto',
    flexShrink: 0,
    minHeight: 36,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 10px 0 14px',
    height: 36,
    border: 'none',
    borderRight: `1px solid ${C.line}`,
    background: 'transparent',
    color: C.dim,
    font: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    height: 26,
    padding: '0 12px',
    background: C.panel,
    borderTop: `1px solid ${C.line}`,
    color: C.dim,
    fontSize: 12,
    flexShrink: 0,
  },
  statusBtn: {
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    padding: '0 4px',
    borderRadius: 4,
  },
};

const PREF_KEYS = {
  autosave: 'vf-codegame-autosave',
  fontSize: 'vf-codegame-fontsize',
  wrap: 'vf-codegame-wrap',
  minimap: 'vf-codegame-minimap',
};

const readPref = (key: string, fallback: string): string => {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
};
const writePref = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // не страшно
  }
};

const cleanFileName = (raw: string): string => {
  const name = raw
    .trim()
    .replace(/[\\:*?"<>|]/g, '')
    .replace(/^\/+/, '');
  if (!name) return '';
  return /\.ms$/i.test(name) ? name : `${name}.ms`;
};

const timeLabel = (): string => {
  const date = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${two(date.getHours())}:${two(date.getMinutes())}:${two(
    date.getSeconds()
  )}`;
};

const ago = (time: number): string => {
  const minutes = Math.round((Date.now() - time) / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.round(hours / 24)} дн назад`;
};

type Props = {| onClose: () => void |};

const CodeGameWorkspace = ({ onClose }: Props): React.Node => {
  const [handle, setHandle] = React.useState<any>(null);
  const [game, setGame] = React.useState<?CodeGame>(null);
  const [section, setSection] = React.useState<Section>('code');
  const [openTabs, setOpenTabs] = React.useState<Array<string>>([]);
  const [active, setActive] = React.useState<?string>(null);
  const [filter, setFilter] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [runUrl, setRunUrl] = React.useState<?string>(null);
  const [runKey, setRunKey] = React.useState(0);
  const [runWidth, setRunWidth] = React.useState(
    Math.round(window.innerWidth * 0.4)
  );
  const [consoleHeight, setConsoleHeight] = React.useState(190);
  const [logs, setLogs] = React.useState<Array<LogLine>>([]);
  const [revision, setRevision] = React.useState(0);
  const [isBusy, setIsBusy] = React.useState(false);
  const [structureDirty, setStructureDirty] = React.useState(false);
  const [autosave, setAutosave] = React.useState(
    readPref(PREF_KEYS.autosave, '1') === '1'
  );
  const [fontSize, setFontSize] = React.useState(
    Number(readPref(PREF_KEYS.fontSize, '14')) || 14
  );
  const [wordWrap, setWordWrap] = React.useState(
    readPref(PREF_KEYS.wrap, '0') === '1'
  );
  const [minimap, setMinimap] = React.useState(
    readPref(PREF_KEYS.minimap, '1') === '1'
  );
  const [ask, setAsk] = React.useState<?{|
    kind: 'new' | 'rename',
    target: ?string,
  |}>(null);
  const [askError, setAskError] = React.useState<?string>(null);
  const [gameTitleAsk, setGameTitleAsk] = React.useState(false);
  const [deleting, setDeleting] = React.useState<?string>(null);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState({ line: 1, column: 1 });
  const [problems, setProblems] = React.useState(0);
  const [reveal, setReveal] = React.useState<?{|
    name: string,
    line: number,
    nonce: number,
  |}>(null);
  const [recents, setRecents] = React.useState<Array<RecentGame>>(
    loadRecentGames()
  );
  const logCounter = React.useRef(0);

  // Сообщения в шапке пропадают сами.
  React.useEffect(
    () => {
      if (!message) return;
      const timer = setTimeout(() => setMessage(''), 4500);
      return () => clearTimeout(timer);
    },
    [message]
  );

  // Консоль игры: сообщения приходят из окна игры.
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data: any = event.data;
      if (!data || !data.__vf) return;
      logCounter.current += 1;
      const line = {
        type: data.type,
        text: data.text,
        key: logCounter.current,
        time: timeLabel(),
      };
      setLogs(previous => [...previous, line].slice(-400));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const loadAssetNames = async (directory: any) => {
    const strip = (names: Array<string>) =>
      names.map(name => name.replace(/\.[^.]+$/, ''));
    const [sprites, sounds, music, maps] = await Promise.all([
      listAssets(directory, 'sprites'),
      listAssets(directory, 'sounds'),
      listAssets(directory, 'music'),
      listAssets(directory, 'maps'),
    ]);
    setAssetNames({
      sprites: strip(sprites),
      sounds: strip(sounds),
      music: strip(music),
      maps: strip(maps),
    });
  };

  // Спрайты, звуки или музыка поменялись: обновляем список resources в игре.
  const onAssetsChanged = async (changed: Array<string>) => {
    if (!game || !handle) return;
    game.html = await syncResourcesInHtml(handle, game.html, changed);
    setStructureDirty(true);
    setRevision(r => r + 1);
    loadAssetNames(handle);
  };

  const openGame = async (directory: any) => {
    setError('');
    try {
      const html = await readIndexHtml(directory);
      const parsed = parseCodeGame(html);
      setHandle(directory);
      setGame(parsed);
      setStructureDirty(false);
      setLogs([]);
      setRunUrl(null);
      if (parsed.files.length) {
        const first = parsed.files.find(f => /^main/i.test(f.name)) || parsed.files[0];
        setOpenTabs([first.name]);
        setActive(first.name);
      } else {
        setOpenTabs([]);
        setActive(null);
      }
      loadAssetNames(directory);
      await rememberGame(directory, parsed.title);
      setRecents(loadRecentGames());
    } catch (e) {
      setError((e && e.message) || 'Не получилось открыть игру.');
    }
  };

  const openFolder = async () => {
    setError('');
    try {
      let directory;
      if (isDesktopApp()) {
        directory = await pickGameFolderDesktop();
        if (!directory) return;
      } else {
        if (typeof window.showDirectoryPicker !== 'function') {
          setError(
            'Этот браузер не умеет открывать папки. Открой в Chrome или Edge, либо поставь десктопную версию.'
          );
          return;
        }
        directory = await window.showDirectoryPicker({
          id: 'voxforge-codegame',
          mode: 'readwrite',
        });
      }
      await openGame(directory);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      setError((e && e.message) || 'Не получилось открыть папку.');
    }
  };

  // Новая игра с нуля: имя, потом пустая папка, в неё кладём движок и main.ms.
  const createNewGame = async (rawTitle: string) => {
    const title = rawTitle.trim() || 'Моя игра';
    setGameTitleAsk(false);
    setError('');
    try {
      let directory;
      if (isDesktopApp()) {
        directory = await pickGameFolderDesktop(
          'Выбери пустую папку для новой игры'
        );
        if (!directory) return;
      } else {
        if (typeof window.showDirectoryPicker !== 'function') {
          setError(
            'Этот браузер не умеет открывать папки. Открой в Chrome или Edge, либо поставь десктопную версию.'
          );
          return;
        }
        directory = await window.showDirectoryPicker({
          id: 'voxforge-codegame',
          mode: 'readwrite',
        });
      }
      await createBlankGame(directory, title);
      await openGame(directory);
      setMessage('Игра создана');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      setError((e && e.message) || 'Не получилось создать игру.');
    }
  };

  const openRecent = async (recent: RecentGame) => {
    setError('');
    try {
      await openGame(await reopenRecentGame(recent));
    } catch (e) {
      setError((e && e.message) || 'Не получилось открыть игру.');
    }
  };

  const openFile = (name: string) => {
    setSection('code');
    setOpenTabs(tabs => (tabs.includes(name) ? tabs : [...tabs, name]));
    setActive(name);
  };

  const closeTab = (name: string) => {
    setOpenTabs(tabs => {
      const index = tabs.indexOf(name);
      const next = tabs.filter(tab => tab !== name);
      if (active === name) {
        setActive(next.length ? next[Math.min(index, next.length - 1)] : null);
      }
      return next;
    });
  };

  const activeFile = game && game.files.find(file => file.name === active);
  const isDirty =
    structureDirty ||
    (!!game && game.files.some(file => file.text !== file.original));

  const save = async () => {
    if (!game || !handle || isBusy) return;
    setIsBusy(true);
    try {
      const html = buildCodeGameHtml(game);
      await writeIndexHtml(handle, html);
      game.files.forEach(file => {
        file.original = file.text;
      });
      game.html = html;
      setStructureDirty(false);
      setMessage('Сохранено');
      setRevision(r => r + 1);
    } catch (e) {
      setMessage((e && e.message) || 'Не получилось сохранить.');
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
    } catch (e) {
      setMessage((e && e.message) || 'Не получилось запустить игру.');
    }
    setIsBusy(false);
  };

  // Автосохранение: через полторы секунды после последней правки.
  const saveRef = React.useRef(save);
  saveRef.current = save;
  React.useEffect(
    () => {
      if (!autosave || !isDirty || !game) return;
      const timer = setTimeout(() => saveRef.current(), 1500);
      return () => clearTimeout(timer);
    },
    [autosave, isDirty, revision, game]
  );

  const runRef = React.useRef(run);
  runRef.current = run;
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveRef.current();
      } else if (event.key === 'F5') {
        event.preventDefault();
        runRef.current();
      } else if (mod && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setQuickOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const requestClose = () => {
    if (isDirty && !autosave) {
      setDeleting('__exit__');
      return;
    }
    if (isDirty && autosave) saveRef.current();
    onClose();
  };

  // --- Файлы: создать, переименовать, удалить. ---
  const submitAsk = (raw: string) => {
    if (!game || !ask) return;
    const name = cleanFileName(raw);
    if (!name) {
      setAskError('Введи имя файла.');
      return;
    }
    if (game.files.some(file => file.name === name && file.name !== ask.target)) {
      setAskError('Файл с таким именем уже есть.');
      return;
    }
    if (ask.kind === 'new') {
      game.files.push({
        name,
        text: `// ${name.replace(/\.ms$/, '')}\n`,
        original: '',
      });
      setGame({ ...game, files: game.files.slice() });
      openFile(name);
    } else if (ask.target) {
      const file = game.files.find(item => item.name === ask.target);
      if (file && file.name !== name) {
        const oldName = file.name;
        file.name = name;
        setGame({ ...game, files: game.files.slice() });
        setOpenTabs(tabs => tabs.map(tab => (tab === oldName ? name : tab)));
        if (active === oldName) setActive(name);
      }
    }
    setStructureDirty(true);
    setAsk(null);
    setAskError(null);
  };

  const confirmDelete = () => {
    const target = deleting;
    setDeleting(null);
    if (target === '__exit__') {
      onClose();
      return;
    }
    if (!game || !target) return;
    closeTab(target);
    setGame({ ...game, files: game.files.filter(file => file.name !== target) });
    setStructureDirty(true);
  };

  const filteredFiles = game
    ? game.files.filter(file =>
        file.name.toLowerCase().includes(filter.trim().toLowerCase())
      )
    : [];

  const outline = React.useMemo(
    () => (activeFile ? getOutline(activeFile.text) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFile && activeFile.name, revision]
  );

  const changeFont = (delta: number) => {
    const next = Math.min(24, Math.max(10, fontSize + delta));
    setFontSize(next);
    writePref(PREF_KEYS.fontSize, String(next));
  };

  const dragResize = (
    event: any,
    onMove: (moveEvent: MouseEvent, startX: number, startY: number) => void
  ) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const move = (moveEvent: MouseEvent) => onMove(moveEvent, startX, startY);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const welcome = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: 24,
      }}
    >
      <div style={{ width: 560, maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <GDevelopGLogo style={{ width: 52, height: 52 }} />
          <div>
            <div style={{ ...styles.title, fontSize: 24 }}>Код-игра</div>
            <div style={{ color: C.dim, marginTop: 4 }}>
              Пиши игру на microScript и запускай её рядом с кодом.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, margin: '22px 0 8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{ ...primaryStyle, padding: '10px 20px', display: 'inline-flex', gap: 8, alignItems: 'center' }}
            onClick={() => setGameTitleAsk(true)}
          >
            <Ico name="plus" size={17} />
            Новая игра с нуля
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, padding: '10px 20px', display: 'inline-flex', gap: 8, alignItems: 'center' }}
            onClick={openFolder}
          >
            <Ico name="folder" size={17} />
            Открыть папку с игрой
          </button>
        </div>
        <div style={{ color: C.dim, fontSize: 13 }}>
          Новая игра появится в пустой папке, которую ты выберешь. Готовую игру
          microStudio открывай папкой, где лежит index.html.
        </div>
        {error ? (
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${C.danger}`,
              color: C.danger,
            }}
          >
            {error}
          </div>
        ) : null}
        {recents.length ? (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Недавние игры</div>
            {recents.map(recent => (
              <div
                key={recent.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 4px 4px 0',
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => openRecent(recent)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 8px',
                    border: 'none',
                    background: 'transparent',
                    color: C.text,
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <Ico name="folder" size={20} />
                  <span style={{ minWidth: 0 }}>
                    <div>{recent.title}</div>
                    <div
                      style={{
                        color: C.dim,
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {recent.path || 'Папка в браузере'} · {ago(recent.openedAt)}
                    </div>
                  </span>
                </button>
                <button
                  type="button"
                  title="Убрать из списка"
                  style={styles.tinyBtn}
                  onClick={() => {
                    forgetRecentGame(recent.id);
                    setRecents(loadRecentGames());
                  }}
                >
                  <Ico name="close" size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  const content = (
    <div style={styles.root} role="dialog" aria-label="Код-игра">
      <div
        style={{
          ...styles.header,
          // В приложении справа рисуются кнопки окна: оставляем им место.
          paddingRight: isDesktopApp() ? 150 : 14,
        }}
      >
        <button type="button" style={styles.btn} onClick={requestClose}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Ico name="back" size={15} /> В меню
          </span>
        </button>
        <GDevelopGLogo style={{ width: 24, height: 24 }} />
        <span style={styles.title}>{game ? game.title : 'Код-игра'}</span>
        {game ? (
          <span style={{ color: C.dim, fontSize: 12 }}>microScript</span>
        ) : null}
        <div style={{ flex: 1 }} />
        {message ? (
          <span style={{ color: C.ok, fontSize: 13, marginRight: 6 }}>{message}</span>
        ) : null}
        {game ? (
          <>
            <button
              type="button"
              style={styles.btn}
              disabled={isBusy || !isDirty}
              onClick={save}
              title="Ctrl+S"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Ico name="save" size={15} />
                {isDirty ? 'Сохранить' : 'Сохранено'}
              </span>
            </button>
            <button
              type="button"
              style={styles.btnPrimary}
              disabled={isBusy}
              onClick={run}
              title="F5"
            >
              <PlayIcon /> Запуск
            </button>
          </>
        ) : null}
      </div>

      {!game ? (
        welcome
      ) : (
        <div style={styles.body}>
          <div style={styles.rail}>
            {RAIL.map(item => {
              const isActive = item.section === section;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.section ? item.label : `${item.label}: скоро`}
                  disabled={!item.section}
                  style={{
                    ...styles.railBtn,
                    color: isActive ? C.text : C.dim,
                    background: isActive ? C.panel2 : 'transparent',
                    opacity: item.section ? 1 : 0.3,
                    cursor: item.section ? 'pointer' : 'default',
                    boxShadow: isActive ? `inset 3px 0 0 ${C.accent}` : 'none',
                  }}
                  onClick={() => item.section && setSection(item.section)}
                >
                  <Ico name={item.icon} size={22} />
                </button>
              );
            })}
          </div>

          {section === 'code' ? (
            <div style={styles.side}>
              <div style={styles.sectionHead}>
                <span style={{ flex: 1 }}>Файлы</span>
                <button
                  type="button"
                  title="Новый файл"
                  style={styles.tinyBtn}
                  onClick={() => {
                    setAskError(null);
                    setAsk({ kind: 'new', target: null });
                  }}
                >
                  <Ico name="plus" size={16} />
                </button>
              </div>
              <div style={{ padding: '0 10px 6px' }}>
                <input
                  style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }}
                  placeholder="Найти файл…"
                  value={filter}
                  onChange={event => setFilter(event.target.value)}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 80 }}>
                {filteredFiles.map(file => {
                  const dirty = file.text !== file.original;
                  return (
                    <div
                      key={file.name}
                      className="vf-file-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: file.name === active ? C.panel2 : 'transparent',
                        boxShadow:
                          file.name === active ? `inset 3px 0 0 ${C.accent}` : 'none',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openFile(file.name)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 6px 6px 12px',
                          border: 'none',
                          background: 'transparent',
                          color: C.text,
                          font: 'inherit',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: C.dim, display: 'flex' }}>
                          <Ico name="file" size={15} />
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name.replace(/\.ms$/, '')}
                        </span>
                        {dirty ? <span style={{ color: C.accent }}>●</span> : null}
                      </button>
                      <button
                        type="button"
                        title="Переименовать"
                        style={styles.tinyBtn}
                        onClick={() => {
                          setAskError(null);
                          setAsk({ kind: 'rename', target: file.name });
                        }}
                      >
                        <Ico name="edit" size={14} />
                      </button>
                      <button
                        type="button"
                        title="Удалить"
                        style={{ ...styles.tinyBtn, marginRight: 6 }}
                        onClick={() => setDeleting(file.name)}
                      >
                        <Ico name="trash" size={14} />
                      </button>
                    </div>
                  );
                })}
                {filteredFiles.length === 0 ? (
                  <div style={{ color: C.faint, padding: '6px 14px', fontSize: 13 }}>
                    Файлов нет.
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  borderTop: `1px solid ${C.line}`,
                  maxHeight: '42%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={styles.sectionHead}>Структура файла</div>
                <div style={{ overflowY: 'auto', paddingBottom: 8 }}>
                  <OutlineList
                    items={outline}
                    onPick={line =>
                      activeFile &&
                      setReveal({
                        name: activeFile.name,
                        line,
                        nonce: Date.now(),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div style={styles.main}>
            {section === 'code' ? (
              <>
                <div style={styles.tabs}>
                  {openTabs.map(name => {
                    const file = game.files.find(item => item.name === name);
                    const dirty = !!file && file.text !== file.original;
                    return (
                      <div
                        key={name}
                        role="tab"
                        tabIndex={0}
                        aria-selected={name === active}
                        onKeyDown={() => {}}
                        onMouseDown={event => {
                          if (event.button === 1) {
                            event.preventDefault();
                            closeTab(name);
                          }
                        }}
                        onClick={() => setActive(name)}
                        style={{
                          ...styles.tab,
                          color: name === active ? C.text : C.dim,
                          background: name === active ? C.bg : 'transparent',
                          boxShadow:
                            name === active ? `inset 0 2px 0 ${C.accent}` : 'none',
                        }}
                      >
                        {name.replace(/\.ms$/, '')}
                        <span
                          role="button"
                          tabIndex={0}
                          title="Закрыть"
                          style={{
                            display: 'inline-flex',
                            width: 18,
                            height: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                            color: dirty ? C.accent : C.dim,
                          }}
                          onClick={event => {
                            event.stopPropagation();
                            closeTab(name);
                          }}
                          onKeyDown={() => {}}
                        >
                          {dirty ? '●' : <Ico name="close" size={13} />}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  <MicroScriptEditor
                    files={game.files.map(file => ({
                      name: file.name,
                      text: file.text,
                    }))}
                    active={activeFile ? activeFile.name : null}
                    fontSize={fontSize}
                    wordWrap={wordWrap}
                    minimap={minimap}
                    reveal={reveal}
                    onChange={(name, text) => {
                      const file = game.files.find(item => item.name === name);
                      if (file && file.text !== text) {
                        file.text = text;
                        setRevision(r => r + 1);
                      }
                    }}
                    onSave={() => saveRef.current()}
                    onRun={() => runRef.current()}
                    onQuickOpen={() => setQuickOpen(true)}
                    onCursor={(line, column) => setCursor({ line, column })}
                    onProblems={setProblems}
                  />
                  {!activeFile ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: C.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 8,
                        color: C.dim,
                      }}
                    >
                      <Ico name="code" size={36} />
                      <div>Выбери файл слева или нажми Ctrl+P.</div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, minHeight: 0, padding: 10 }}>
                <CodeGameAssets
                  directory={handle}
                  folder={section}
                  game={game}
                  onChanged={onAssetsChanged}
                  onHtmlChanged={html => {
                    game.html = html;
                    setStructureDirty(true);
                    setRevision(r => r + 1);
                  }}
                />
              </div>
            )}
          </div>

          <div
            title="Потяни, чтобы изменить ширину"
            style={{ width: 5, cursor: 'col-resize', background: C.line, flexShrink: 0 }}
            onMouseDown={(event: any) => {
              const startWidth = runWidth;
              dragResize(event, (moveEvent, startX) =>
                setRunWidth(
                  Math.min(
                    window.innerWidth - 560,
                    Math.max(300, startWidth + (startX - moveEvent.clientX))
                  )
                )
              );
            }}
          />
          <div
            style={{
              width: runWidth,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: C.panel,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 10px',
                borderBottom: `1px solid ${C.line}`,
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 600 }}>Игра</span>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                style={styles.iconBtn}
                onClick={run}
                disabled={isBusy}
                title="Перезапуск (F5)"
              >
                <Ico name="refresh" size={15} /> Перезапуск
              </button>
              <button
                type="button"
                style={styles.iconBtn}
                onClick={() => setRunUrl(null)}
                disabled={!runUrl}
                title="Остановить игру"
              >
                <Ico name="stop" size={14} /> Стоп
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
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 10,
                    color: C.dim,
                  }}
                >
                  <button type="button" style={styles.btnPrimary} onClick={run}>
                    <PlayIcon /> Запустить игру
                  </button>
                  <div style={{ fontSize: 12 }}>или нажми F5</div>
                </div>
              )}
            </div>
            <div
              title="Потяни, чтобы изменить высоту консоли"
              style={{ height: 5, cursor: 'row-resize', background: C.line, flexShrink: 0 }}
              onMouseDown={(event: any) => {
                const startHeight = consoleHeight;
                dragResize(event, (moveEvent, startX, startY) =>
                  setConsoleHeight(
                    Math.min(
                      window.innerHeight - 260,
                      Math.max(80, startHeight + (startY - moveEvent.clientY))
                    )
                  )
                );
              }}
            />
            <ConsolePanel
              logs={logs}
              height={consoleHeight}
              onClear={() => setLogs([])}
            />
          </div>
        </div>
      )}

      {game ? (
        <div style={styles.status}>
          <span>microScript</span>
          {activeFile ? (
            <span>
              Строка {cursor.line}, столбец {cursor.column}
            </span>
          ) : null}
          <span style={{ color: problems ? C.warn : C.dim }}>
            {problems ? `Проблем: ${problems}` : 'Проблем нет'}
          </span>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            style={{ ...styles.statusBtn, color: autosave ? C.ok : C.dim }}
            title="Сохранять сам через полторы секунды после правки"
            onClick={() => {
              setAutosave(!autosave);
              writePref(PREF_KEYS.autosave, autosave ? '0' : '1');
            }}
          >
            Автосохранение: {autosave ? 'вкл' : 'выкл'}
          </button>
          <span>
            <button type="button" style={styles.statusBtn} onClick={() => changeFont(-1)}>
              −
            </button>
            Шрифт {fontSize}
            <button type="button" style={styles.statusBtn} onClick={() => changeFont(1)}>
              +
            </button>
          </span>
          <button
            type="button"
            style={{ ...styles.statusBtn, color: wordWrap ? C.text : C.dim }}
            onClick={() => {
              setWordWrap(!wordWrap);
              writePref(PREF_KEYS.wrap, wordWrap ? '0' : '1');
            }}
          >
            Перенос строк
          </button>
          <button
            type="button"
            style={{ ...styles.statusBtn, color: minimap ? C.text : C.dim }}
            onClick={() => {
              setMinimap(!minimap);
              writePref(PREF_KEYS.minimap, minimap ? '0' : '1');
            }}
          >
            Миникарта
          </button>
          <span>Файлов: {game.files.length}</span>
          <span style={{ color: isDirty ? C.accent : C.dim }}>
            {isDirty ? 'Есть несохранённые правки' : 'Всё сохранено'}
          </span>
        </div>
      ) : null}

      {gameTitleAsk ? (
        <AskName
          title="Как назвать игру?"
          hint="Потом выберешь пустую папку, куда положу движок и первый файл main.ms."
          initial="Моя игра"
          okLabel="Дальше"
          error={null}
          onOk={createNewGame}
          onCancel={() => setGameTitleAsk(false)}
        />
      ) : null}
      {ask ? (
        <AskName
          title={ask.kind === 'new' ? 'Новый файл' : 'Переименовать файл'}
          hint="Расширение .ms добавится само."
          initial={ask.target ? ask.target.replace(/\.ms$/, '') : ''}
          okLabel={ask.kind === 'new' ? 'Создать' : 'Сохранить'}
          error={askError}
          onOk={submitAsk}
          onCancel={() => {
            setAsk(null);
            setAskError(null);
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmBox
          title={deleting === '__exit__' ? 'Выйти без сохранения?' : 'Удалить файл?'}
          text={
            deleting === '__exit__'
              ? 'В коде есть несохранённые правки. Если выйти сейчас, они пропадут.'
              : `Файл «${deleting.replace(/\.ms$/, '')}» исчезнет из игры после сохранения. Исходная копия index.html.original останется.`
          }
          okLabel={deleting === '__exit__' ? 'Выйти' : 'Удалить'}
          danger
          onOk={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
      {quickOpen && game ? (
        <QuickOpen
          names={game.files.map(file => file.name)}
          onPick={name => {
            setQuickOpen(false);
            openFile(name);
          }}
          onCancel={() => setQuickOpen(false)}
        />
      ) : null}
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CodeGameWorkspace;
