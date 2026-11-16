// @flow
// VoxForge: вкладки «Спрайты», «Звуки», «Музыка» у код-игры.
import * as React from 'react';
import Text from '../UI/Text';
import { type AssetFolder, listAssets, readAssetUrl } from './CodeGameFiles';

const styles = {
  wrap: {
    display: 'flex',
    gap: 12,
    height: 'calc(100vh - 300px)',
    minHeight: 320,
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
    gap: 8,
    alignContent: 'start',
    padding: 8,
    border: '1px solid var(--vf-card-border)',
    borderRadius: 8,
    background: 'var(--vf-card-bg)',
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
    color: 'var(--theme-text-default-color)',
    font: 'inherit',
    cursor: 'pointer',
  },
  cellSelected: {
    borderColor: 'var(--theme-primary-color)',
    background: 'var(--vf-accent-soft, rgba(255,138,61,0.16))',
  },
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
    maxWidth: 84,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  side: {
    width: 280,
    flexShrink: 0,
    padding: 12,
    border: '1px solid var(--vf-card-border)',
    borderRadius: 8,
    background: 'var(--vf-card-bg)',
    overflowY: 'auto',
  },
  preview: {
    maxWidth: '100%',
    maxHeight: 220,
    imageRendering: 'pixelated',
    background:
      'repeating-conic-gradient(rgba(128,128,128,0.18) 0% 25%, transparent 0% 50%) 50% / 16px 16px',
  },
  row: {
    display: 'flex',
    width: '100%',
    gap: 8,
    alignItems: 'center',
    padding: '6px 10px',
    border: 'none',
    background: 'transparent',
    color: 'var(--theme-text-default-color)',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
};

const formatSize = (bytes: number): string =>
  bytes < 1024 ? `${bytes} Б` : `${(bytes / 1024).toFixed(1)} КБ`;

type Props = {| directory: any, folder: AssetFolder |};

const CodeGameAssets = ({ directory, folder }: Props): React.Node => {
  const [names, setNames] = React.useState<Array<string>>([]);
  const [urls, setUrls] = React.useState<{ [name: string]: string }>({});
  const [selected, setSelected] = React.useState<?string>(null);
  const [selectedInfo, setSelectedInfo] = React.useState<?{|
    url: string,
    size: number,
    width: number,
    height: number,
  |}>(null);
  const isImage = folder === 'sprites';

  React.useEffect(
    () => {
      let cancelled = false;
      const created = [];
      setNames([]);
      setUrls({});
      setSelected(null);
      setSelectedInfo(null);
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
    [directory, folder, isImage]
  );

  const choose = async (name: string) => {
    setSelected(name);
    const { url, size } = await readAssetUrl(directory, folder, name);
    if (isImage) {
      const image = new Image();
      image.onload = () =>
        setSelectedInfo({
          url,
          size,
          width: image.width,
          height: image.height,
        });
      image.src = url;
    } else {
      setSelectedInfo({ url, size, width: 0, height: 0 });
    }
  };

  if (!names.length) {
    return (
      <div style={{ padding: 24 }}>
        <Text>В папке «{folder}» пока ничего нет.</Text>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      {isImage ? (
        <div style={styles.grid}>
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
              <span style={styles.name}>{name.replace(/\.[^.]+$/, '')}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ ...styles.grid, display: 'block', padding: 4 }}>
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
              {name}
            </button>
          ))}
        </div>
      )}
      <div style={styles.side}>
        {selected && selectedInfo ? (
          <>
            <Text>{selected}</Text>
            <Text size="body-small" color="secondary">
              {formatSize(selectedInfo.size)}
              {isImage ? ` · ${selectedInfo.width}×${selectedInfo.height}` : ''}
            </Text>
            {isImage ? (
              <img
                src={selectedInfo.url}
                alt={selected}
                style={styles.preview}
              />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio
                key={selectedInfo.url}
                src={selectedInfo.url}
                controls
                autoPlay
              />
            )}
          </>
        ) : (
          <Text color="secondary">Выбери файл слева.</Text>
        )}
      </div>
    </div>
  );
};

export default CodeGameAssets;
