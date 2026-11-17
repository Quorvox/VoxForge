// @flow
// VoxForge: мелкие части экрана Код-игры: значки, окошки ввода, быстрый
// переход к файлу (Ctrl+P), консоль, структура файла.
import * as React from 'react';
import { type OutlineItem } from './MicroScript';

export const C = {
  bg: '#0d0b09',
  panel: '#14110e',
  panel2: '#1b1611',
  panel3: '#241c14',
  line: 'rgba(255,255,255,0.08)',
  text: '#f4ede5',
  dim: '#9b8f84',
  faint: '#6f6558',
  accent: 'var(--theme-primary-color, #ff8a3d)',
  danger: '#ff7a6a',
  warn: '#ffcf6a',
  ok: '#7fd18b',
};

const ICONS: { [name: string]: string } = {
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  sprites: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4',
  maps: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  sounds: 'M4 9v6h4l5 4V5L8 9zM16 8a5 5 0 010 8',
  music: 'M9 18V6l10-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM19 16a3 3 0 11-6 0 3 3 0 016 0z',
  docs: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  file: 'M7 3h7l4 4v14H7zM14 3v4h4',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  refresh: 'M20 12a8 8 0 10-2.3 5.6M20 5v5h-5',
  stop: 'M7 7h10v10H7z',
  save: 'M5 4h12l3 3v13H5zM8 4v6h8V4M8 20v-6h8v6',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 6l6 6-6 6',
  folder: 'M3 6h6l2 2h10v11H3z',
  func: 'M9 4c-2 0-3 1-3 3v3H4v3h2v4c0 2 1 3 3 3M15 4c2 0 3 1 3 3v3h2v3h-2v4c0 2-1 3-3 3',
  object: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  clear: 'M5 7h14M9 7l1-3h4l1 3M7 7l1 13h8l1-13',
  warn: 'M12 4l9 16H3zM12 10v4M12 17v.5',
};

export const Ico = ({
  name,
  size = 18,
}: {|
  name: string,
  size?: number,
|}): React.Node => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d={ICONS[name] || ICONS.file} />
  </svg>
);

export const PlayIcon = (): React.Node => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M2 1l9 5-9 5z" />
  </svg>
);

const overlay: Object = {
  position: 'fixed',
  inset: 0,
  zIndex: 1500,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '14vh',
};

const card: Object = {
  width: 440,
  maxWidth: '92vw',
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
  padding: 16,
  color: C.text,
};

const inputStyle: Object = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  border: `1px solid ${C.line}`,
  borderRadius: 7,
  background: C.bg,
  color: C.text,
  font: 'inherit',
  outline: 'none',
};

const buttonStyle: Object = {
  padding: '7px 16px',
  border: `1px solid ${C.line}`,
  borderRadius: 7,
  background: C.panel2,
  color: C.text,
  font: 'inherit',
  cursor: 'pointer',
};

const primaryStyle: Object = {
  ...buttonStyle,
  border: 'none',
  background: C.accent,
  color: '#1a0f06',
  fontWeight: 700,
};

/** Окошко с одним полем: имя нового файла, переименование. */
export const AskName = ({
  title,
  hint,
  initial,
  okLabel,
  error,
  onOk,
  onCancel,
}: {|
  title: string,
  hint?: string,
  initial: string,
  okLabel: string,
  error: ?string,
  onOk: (value: string) => void,
  onCancel: () => void,
|}): React.Node => {
  const [value, setValue] = React.useState(initial);
  const input = React.useRef<?HTMLInputElement>(null);
  React.useEffect(() => {
    if (input.current) {
      input.current.focus();
      input.current.select();
    }
  }, []);
  return (
    <div style={overlay} onMouseDown={onCancel}>
      <div style={card} onMouseDown={event => event.stopPropagation()}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>{title}</div>
        <input
          ref={input}
          style={inputStyle}
          value={value}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') onOk(value);
            if (event.key === 'Escape') onCancel();
          }}
        />
        {hint ? (
          <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>{hint}</div>
        ) : null}
        {error ? (
          <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>{error}</div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" style={buttonStyle} onClick={onCancel}>
            Отмена
          </button>
          <button type="button" style={primaryStyle} onClick={() => onOk(value)}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConfirmBox = ({
  title,
  text,
  okLabel,
  danger,
  onOk,
  onCancel,
}: {|
  title: string,
  text: string,
  okLabel: string,
  danger?: boolean,
  onOk: () => void,
  onCancel: () => void,
|}): React.Node => (
  <div style={overlay} onMouseDown={onCancel}>
    <div style={card} onMouseDown={event => event.stopPropagation()}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ color: C.dim, lineHeight: 1.45 }}>{text}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" style={buttonStyle} onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          style={{
            ...primaryStyle,
            ...(danger ? { background: C.danger } : {}),
          }}
          onClick={onOk}
        >
          {okLabel}
        </button>
      </div>
    </div>
  </div>
);

/** Ctrl+P: быстрый переход к файлу. */
export const QuickOpen = ({
  names,
  onPick,
  onCancel,
}: {|
  names: Array<string>,
  onPick: (name: string) => void,
  onCancel: () => void,
|}): React.Node => {
  const [query, setQuery] = React.useState('');
  const [index, setIndex] = React.useState(0);
  const input = React.useRef<?HTMLInputElement>(null);
  React.useEffect(() => {
    if (input.current) input.current.focus();
  }, []);
  const list = names.filter(name =>
    name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const safeIndex = Math.min(index, Math.max(0, list.length - 1));
  return (
    <div style={overlay} onMouseDown={onCancel}>
      <div style={{ ...card, padding: 10 }} onMouseDown={event => event.stopPropagation()}>
        <input
          ref={input}
          style={inputStyle}
          placeholder="Имя файла…"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') onCancel();
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIndex(Math.min(list.length - 1, safeIndex + 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setIndex(Math.max(0, safeIndex - 1));
            }
            if (event.key === 'Enter' && list[safeIndex]) onPick(list[safeIndex]);
          }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 8 }}>
          {list.length === 0 ? (
            <div style={{ color: C.dim, padding: 10 }}>Такого файла нет.</div>
          ) : null}
          {list.map((name, itemIndex) => (
            <button
              key={name}
              type="button"
              onClick={() => onPick(name)}
              onMouseEnter={() => setIndex(itemIndex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '7px 10px',
                border: 'none',
                borderRadius: 6,
                background: itemIndex === safeIndex ? C.panel3 : 'transparent',
                color: C.text,
                font: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <Ico name="file" size={15} />
              {name.replace(/\.ms$/, '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export type LogLine = {|
  type: string,
  text: string,
  key: number,
  time: string,
|};

export const ConsolePanel = ({
  logs,
  onClear,
  height,
}: {|
  logs: Array<LogLine>,
  onClear: () => void,
  height: number,
|}): React.Node => {
  const [filter, setFilter] = React.useState<'all' | 'error' | 'warn'>('all');
  const end = React.useRef<?HTMLDivElement>(null);
  const errors = logs.filter(line => line.type === 'error').length;
  const warns = logs.filter(line => line.type === 'warn').length;
  const shown = logs.filter(line => filter === 'all' || line.type === filter);
  React.useEffect(
    () => {
      if (end.current) end.current.scrollIntoView({ block: 'end' });
    },
    [shown.length]
  );
  const chip = (id: 'all' | 'error' | 'warn', label: string, color: string) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      style={{
        padding: '2px 9px',
        border: 'none',
        borderRadius: 10,
        background: filter === id ? C.panel3 : 'transparent',
        color: filter === id ? color : C.dim,
        font: 'inherit',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      style={{
        height,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderTop: `1px solid ${C.line}`,
        background: C.bg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <span style={{ fontWeight: 600, marginRight: 6 }}>Консоль</span>
        {chip('all', `Все ${logs.length}`, C.text)}
        {chip('error', `Ошибки ${errors}`, C.danger)}
        {chip('warn', `Предупреждения ${warns}`, C.warn)}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          title="Очистить консоль"
          onClick={onClear}
          style={{
            display: 'flex',
            border: 'none',
            background: 'transparent',
            color: C.dim,
            cursor: 'pointer',
            padding: 3,
          }}
        >
          <Ico name="clear" size={16} />
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 10px',
          fontFamily: "'JetBrains Mono', Consolas, 'Lucida Console', monospace",
          fontSize: 12,
        }}
      >
        {shown.length === 0 ? (
          <div style={{ color: C.faint, padding: '6px 0' }}>
            Здесь появится вывод print() и ошибки игры.
          </div>
        ) : null}
        {shown.map(line => (
          <div
            key={line.key}
            style={{
              display: 'flex',
              gap: 8,
              padding: '1px 0',
              color:
                line.type === 'error'
                  ? C.danger
                  : line.type === 'warn'
                  ? C.warn
                  : C.text,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <span style={{ color: C.faint, flexShrink: 0 }}>{line.time}</span>
            <span>{line.text}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
    </div>
  );
};

export const OutlineList = ({
  items,
  onPick,
}: {|
  items: Array<OutlineItem>,
  onPick: (line: number) => void,
|}): React.Node => {
  if (!items.length) {
    return (
      <div style={{ color: C.faint, padding: '4px 14px', fontSize: 12 }}>
        В файле пока нет функций и объектов.
      </div>
    );
  }
  return (
    <div>
      {items.map(item => (
        <button
          key={`${item.line}-${item.name}`}
          type="button"
          onClick={() => onPick(item.line)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            width: '100%',
            padding: `4px 12px 4px ${14 + item.depth * 14}px`,
            border: 'none',
            background: 'transparent',
            color: C.text,
            font: 'inherit',
            fontSize: 13,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span style={{ color: item.kind === 'function' ? '#5ec4d4' : '#ffcb6b' }}>
            <Ico name={item.kind === 'function' ? 'func' : 'object'} size={14} />
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.name}
          </span>
          <span style={{ color: C.faint, fontSize: 11 }}>{item.line}</span>
        </button>
      ))}
    </div>
  );
};

export const sharedButtons = { buttonStyle, primaryStyle, inputStyle };
