// @flow
import * as React from 'react';
import Dialog from '../UI/Dialog';
import FlatButton from '../UI/FlatButton';
import ControllerIcon from '../UI/CustomSvgIcons/Controller';
import Mobile from '../UI/CustomSvgIcons/Mobile';
import classes from './ProjectTypeDialog.module.css';
import { vf, useVfLanguage } from '../Utils/i18n/vfStrings';
import CodeIcon from '../UI/CustomSvgIcons/Code';

type Props = {|
  open: boolean,
  onClose: () => void,
  /** Игра выбрана — дальше открываются шаблоны. */
  onChooseGame: () => void,
  /** Код-игра выбрана — откроется редактор игры microStudio. */
  onChooseCodeGame?: () => void,
|};

type ProjectType = {|
  id: string,
  title: string,
  description: string,
  icon: React.Node,
  available: boolean,
|};

const projectTypes: Array<ProjectType> = [
  {
    id: 'game',
    title: 'Игра',
    description:
      '2D и 3D, для Windows, Android и веба. Начни с шаблона или с пустой сцены.',
    // title/description — русские ключи, переводятся при показе через vf().
    icon: <ControllerIcon />,
    available: true,
  },
  {
    id: 'codegame',
    title: 'Код-игра',
    description:
      'Игры на microScript из microStudio: открой папку игры, правь код и запускай.',
    icon: <CodeIcon />,
    available: true,
  },
  {
    id: 'app',
    title: 'Приложение',
    description: 'Приложения для телефона и ПК на том же редакторе. Скоро.',
    icon: <Mobile />,
    available: false,
  },
];

/**
 * VoxForge: первый шаг создания проекта — что именно создаём. Шаблоны
 * показываются только после выбора типа, как в Unity Hub.
 */
const ProjectTypeDialog = ({
  open,
  onClose,
  onChooseGame,
  onChooseCodeGame,
}: Props): React.Node => {
  useVfLanguage();
  if (!open) return null;

  return (
    <Dialog
      open
      title={vf('Что создаём?')}
      maxWidth="sm"
      onRequestClose={onClose}
      actions={[
        <FlatButton key="close" label={vf('Отмена')} onClick={onClose} />,
      ]}
    >
      <div className={classes.grid}>
        {projectTypes.map(type => (
          <button
            key={type.id}
            type="button"
            className={classes.card}
            disabled={!type.available}
            onClick={
              type.id === 'codegame'
                ? onChooseCodeGame
                : type.available
                ? onChooseGame
                : undefined
            }
          >
            <span className={classes.icon}>{type.icon}</span>
            <span className={classes.title}>{vf(type.title)}</span>
            <span className={classes.description}>{vf(type.description)}</span>
            {!type.available && (
              <span className={classes.badge}>{vf('Скоро')}</span>
            )}
          </button>
        ))}
      </div>
    </Dialog>
  );
};

export default ProjectTypeDialog;
