// @flow
// VoxForge: мини-рисовалка спрайтов для Код-игры. Карандаш, ластик, заливка,
// пипетка, отмена. Результат сохраняется PNG в папку sprites.
import * as React from 'react';
import { C, Ico, sharedButtons } from './CodeGameParts';

const { buttonStyle, primaryStyle, inputStyle } = sharedButtons;

const PALETTE = [
  '#000000',
  '#ffffff',
  '#7c7c7c',
  '#bcbcbc',
  '#ff3b30',
  '#ff8a3d',
  '#ffcb3d',
  '#7fd18b',
  '#1f9d55',
  '#5ec4d4',
  '#2f6fed',
  '#7a3fd1',
  '#d14fa6',
  '#8a5a3a',
  '#4a2f1f',
  '#f2d2b0',
];

type Tool = 'pencil' | 'eraser' | 'fill' | 'pick';

const hexToRgba = (hex: string): [number, number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
  255,
];

const rgbaToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;

type Props = {|
  /** Имя без расширения; пусто для нового спрайта. */
  initialName: string,
  /** Картинка для редактирования (blob-адрес) или null для чистого холста. */
  initialUrl: ?string,
  onSave: (name: string, blob: Blob) => Promise<void>,
  onCancel: () => void,
|};

const SpriteEditor = ({
  initialName,
  initialUrl,
  onSave,
  onCancel,
}: Props): React.Node => {
  const [size, setSize] = React.useState(32);
  const [name, setName] = React.useState(initialName);
  const [tool, setTool] = React.useState<Tool>('pencil');
  const [color, setColor] = React.useState('#ff8a3d');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [history, setHistory] = React.useState(0);
  const canvasRef = React.useRef<?HTMLCanvasElement>(null);
  const undoStack = React.useRef<Array<ImageData>>([]);
  const drawing = React.useRef<?{| x: number, y: number |}>(null);
  const lockedSize = !!initialUrl;

  const context = (): any => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  };

  // Чистый холст при смене размера, картинка при редактировании.
  React.useEffect(
    () => {
      const canvas = canvasRef.current;
      const ctx = context();
      if (!canvas || !ctx) return;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);
      undoStack.current = [];
      setHistory(h => h + 1);
    },
    [size]
  );

  React.useEffect(
    () => {
      if (!initialUrl) return;
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const ctx = context();
        if (!canvas || !ctx) return;
        const side = Math.min(128, Math.max(image.width, image.height));
        setSize(side);
        // setSize перерисует холст в эффекте выше; рисуем картинку чуть позже.
        setTimeout(() => {
          const c = canvasRef.current;
          const x = context();
          if (!c || !x) return;
          x.clearRect(0, 0, c.width, c.height);
          x.drawImage(image, 0, 0);
        }, 0);
      };
      image.src = initialUrl;
    },
    [initialUrl]
  );

  const pushUndo = () => {
    const canvas = canvasRef.current;
    const ctx = context();
    if (!canvas || !ctx) return;
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.current.length > 40) undoStack.current.shift();
    setHistory(h => h + 1);
  };

  const undo = () => {
    const ctx = context();
    const last = undoStack.current.pop();
    if (ctx && last) ctx.putImageData(last, 0, 0);
    setHistory(h => h + 1);
  };

  const cellFromEvent = (event: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
    return { x, y };
  };

  const putPixel = (x: number, y: number) => {
    const ctx = context();
    if (!ctx) return;
    if (tool === 'eraser') {
      ctx.clearRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const line = (x0: number, y0: number, x1: number, y1: number) => {
    // Линия Брезенхэма: без дыр при быстром движении мыши.
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      putPixel(x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = context();
    if (!canvas || !ctx) return;
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    const index = (x: number, y: number) => (y * canvas.width + x) * 4;
    const start = index(startX, startY);
    const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
    const fill = hexToRgba(color);
    if (target.every((value, i) => value === fill[i])) return;
    const same = (i: number) =>
      data[i] === target[0] &&
      data[i + 1] === target[1] &&
      data[i + 2] === target[2] &&
      data[i + 3] === target[3];
    const stack = [[startX, startY]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
      const i = index(x, y);
      if (!same(i)) continue;
      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = fill[3];
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(image, 0, 0);
  };

  const onDown = (event: any) => {
    const cell = cellFromEvent(event);
    if (!cell) return;
    event.preventDefault();
    if (tool === 'pick') {
      const ctx = context();
      const pixel = ctx.getImageData(cell.x, cell.y, 1, 1).data;
      if (pixel[3] > 0) setColor(rgbaToHex(pixel[0], pixel[1], pixel[2]));
      return;
    }
    pushUndo();
    if (tool === 'fill') {
      floodFill(cell.x, cell.y);
      return;
    }
    drawing.current = cell;
    putPixel(cell.x, cell.y);
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onMove = (event: any) => {
    const last = drawing.current;
    if (!last) return;
    const cell = cellFromEvent(event);
    if (!cell) return;
    line(last.x, last.y, cell.x, cell.y);
    drawing.current = cell;
  };

  const stop = () => {
    drawing.current = null;
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const clean = name.trim().replace(/\.png$/i, '');
    if (!clean) {
      setError('Дай спрайту имя.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          result => (result ? resolve(result) : reject(new Error('Пустая картинка.'))),
          'image/png'
        )
      );
      await onSave(clean, blob);
    } catch (e) {
      setError((e && e.message) || 'Не получилось сохранить спрайт.');
      setBusy(false);
    }
  };

  const toolButton = (id: Tool, label: string, hint: string) => (
    <button
      key={id}
      type="button"
      title={hint}
      onClick={() => setTool(id)}
      style={{
        ...buttonStyle,
        padding: '6px 12px',
        background: tool === id ? C.panel3 : C.panel2,
        borderColor: tool === id ? C.accent : C.line,
      }}
    >
      {label}
    </button>
  );

  const view = 512;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 16,
          color: C.text,
          maxWidth: '96vw',
          maxHeight: '96vh',
          overflow: 'auto',
          display: 'flex',
          gap: 16,
        }}
      >
        <div>
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={stop}
            onPointerCancel={stop}
            style={{
              width: view,
              height: view,
              maxWidth: '60vw',
              maxHeight: '60vw',
              imageRendering: 'pixelated',
              cursor: tool === 'pick' ? 'copy' : 'crosshair',
              touchAction: 'none',
              border: `1px solid ${C.line}`,
              background:
                'repeating-conic-gradient(rgba(128,128,128,0.22) 0% 25%, transparent 0% 50%) 50% / 16px 16px',
            }}
          />
        </div>
        <div style={{ width: 230, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {initialUrl ? 'Редактор спрайта' : 'Новый спрайт'}
          </div>
          <input
            style={inputStyle}
            placeholder="Имя спрайта"
            value={name}
            onChange={event => setName(event.target.value)}
          />
          {lockedSize ? null : (
            <div>
              <div style={{ color: C.dim, fontSize: 12, marginBottom: 4 }}>Размер</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[16, 32, 64].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSize(value)}
                    style={{
                      ...buttonStyle,
                      flex: 1,
                      padding: '5px 0',
                      borderColor: size === value ? C.accent : C.line,
                      background: size === value ? C.panel3 : C.panel2,
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {toolButton('pencil', 'Карандаш', 'Рисовать пиксели')}
            {toolButton('eraser', 'Ластик', 'Стирать')}
            {toolButton('fill', 'Заливка', 'Залить область')}
            {toolButton('pick', 'Пипетка', 'Взять цвет с картинки')}
          </div>
          <div>
            <div style={{ color: C.dim, fontSize: 12, marginBottom: 4 }}>Цвет</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
              {PALETTE.map(value => (
                <button
                  key={value}
                  type="button"
                  title={value}
                  onClick={() => {
                    setColor(value);
                    if (tool === 'eraser' || tool === 'pick') setTool('pencil');
                  }}
                  style={{
                    height: 24,
                    border:
                      color === value ? `2px solid ${C.accent}` : `1px solid ${C.line}`,
                    borderRadius: 4,
                    background: value,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={event => setColor(event.target.value)}
              style={{ marginTop: 8, width: '100%', height: 30, background: 'transparent', border: 'none' }}
            />
          </div>
          <button
            type="button"
            style={{ ...buttonStyle, display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}
            disabled={undoStack.current.length === 0}
            onClick={undo}
            data-history={history}
          >
            <Ico name="back" size={15} /> Отменить
          </button>
          {error ? <div style={{ color: C.danger, fontSize: 12 }}>{error}</div> : null}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ ...buttonStyle, flex: 1 }} onClick={onCancel}>
              Отмена
            </button>
            <button
              type="button"
              style={{ ...primaryStyle, flex: 1 }}
              disabled={busy}
              onClick={save}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpriteEditor;
