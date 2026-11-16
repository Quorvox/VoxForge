// @flow
import * as React from 'react';
import classNames from 'classnames';
import classes from './ExpandingActionButton.module.css';

type Props = {|
  label: string,
  icon: React.Node,
  onClick: () => void,
  primary?: boolean,
  /** Активный пункт навигации: подпись видна всегда. */
  active?: boolean,
  disabled?: boolean,
  id?: string,
|};

/**
 * VoxForge: кнопка из одной иконки. При наведении или фокусе с клавиатуры
 * из неё плавно выезжает подпись. Подпись всегда есть для скринридеров
 * (aria-label).
 */
const ExpandingActionButton = ({
  label,
  icon,
  onClick,
  primary,
  active,
  disabled,
  id,
}: Props): React.Node => (
  <button
    type="button"
    id={id}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className={classNames(classes.button, {
      [classes.primary]: primary,
      [classes.secondary]: !primary,
      [classes.active]: active,
    })}
    aria-current={active ? 'page' : undefined}
  >
    <span className={classes.icon}>{icon}</span>
    {/* Раскрытие идёт по реальной ширине текста (grid 0fr → 1fr), а не по
        выдуманному max-width: так движение ровное. */}
    <span className={classes.labelWrap}>
      <span className={classes.label}>
        <span className={classes.labelText}>{label}</span>
      </span>
    </span>
  </button>
);

export default ExpandingActionButton;
