// @flow
import * as React from 'react';
import {
  ACCENTS,
  getStoredAccentId,
  setStoredAccentId,
  subscribeToAccentChange,
} from './Accent';
import { vf, useVfLanguage } from '../../Utils/i18n/vfStrings';

const styles = {
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: '4px 0',
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    padding: 0,
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'transform 140ms ease, box-shadow 140ms ease',
  },
};

/** Выбор цвета акцента интерфейса: ряд цветных кружков. */
const AccentPicker = (): React.Node => {
  useVfLanguage();
  const [accentId, setAccentId] = React.useState(getStoredAccentId());

  React.useEffect(
    () => subscribeToAccentChange(() => setAccentId(getStoredAccentId())),
    []
  );

  return (
    <div style={styles.row} role="radiogroup" aria-label={vf('Цвет акцента')}>
      {ACCENTS.map(accent => {
        const isSelected = accent.id === accentId;
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            title={vf(accent.label)}
            onClick={() => setStoredAccentId(accent.id)}
            style={{
              ...styles.swatch,
              background: accent.swatch,
              borderColor: isSelected
                ? 'var(--theme-text-default-color)'
                : 'transparent',
              boxShadow: isSelected
                ? '0 0 0 2px var(--theme-surface-background-color, #000) inset'
                : 'none',
              transform: isSelected ? 'scale(1.12)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

export default AccentPicker;
