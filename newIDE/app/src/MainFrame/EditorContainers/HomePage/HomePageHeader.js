// @flow
import * as React from 'react';
import { I18n } from '@lingui/react';
import { t } from '@lingui/macro';
import TranslateIcon from '@material-ui/icons/Translate';
import { Line } from '../../../UI/Grid';
import QuorvoxProfileChip from '../../../Profile/QuorvoxId/QuorvoxProfileChip';
import TextButton from '../../../UI/TextButton';
import IconButton from '../../../UI/IconButton';
import { useResponsiveWindowSize } from '../../../UI/Responsive/ResponsiveWindowMeasurer';
import SaveProjectIcon from '../../SaveProjectIcon';
import HistoryIcon from '../../../UI/CustomSvgIcons/History';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import { type FileMetadata } from '../../../ProjectsStorage';
import ExpandingActionButton from '../../../UI/ExpandingActionButton';
import AddIcon from '../../../UI/CustomSvgIcons/Add';
import FolderIcon from '../../../UI/CustomSvgIcons/Folder';
import Preferences from '../../../UI/CustomSvgIcons/Preferences';
import GDevelopGLogo from '../../../UI/CustomSvgIcons/GDevelopGLogo';
import { type HomeTab, getTabsToDisplay } from './HomePageMenu';
import HomePageTopNav from './HomePageTopNav';
import { vf, useVfLanguage } from '../../../Utils/i18n/vfStrings';

const styles = {
  // Три колонки: марка слева, навигация строго по центру, действия справа.
  bar: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  barMobile: {
    gridTemplateColumns: '1fr auto',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  groupRight: {
    justifyContent: 'flex-end',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  brandMark: {
    width: 24,
    height: 24,
    color: 'var(--theme-primary-color)',
  },
  brandName: {
    fontFamily: "'Unbounded', var(--gdevelop-modern-font-family)",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'var(--theme-text-default-color)',
  },
  divider: {
    width: 1,
    height: 20,
    margin: '0 6px',
    background: 'var(--theme-dialog-separator-color)',
  },
};

type Props = {|
  hasProject: boolean,
  onOpenVersionHistory: () => void,
  onOpenProfile: () => void,
  onOpenLanguageDialog: () => void,
  onSave: (options?: {|
    skipNewVersionWarning: boolean,
  |}) => Promise<?FileMetadata>,
  canSave: boolean,
  onCreateProject: () => void,
  onChooseProject: () => void,
  canOpen: boolean,
  activeTab: HomeTab,
  setActiveTab: HomeTab => void,
  onOpenPreferences: () => void,
  onOpenAbout: () => void,
|};

/**
 * VoxForge: вся навигация живёт в верхней панели. Пункты — иконки, подпись
 * выезжает при наведении; у активного пункта подпись видна всегда.
 */
export const HomePageHeader = ({
  onCreateProject,
  onChooseProject,
  canOpen,
  activeTab,
  setActiveTab,
  onOpenPreferences,
  onOpenAbout,
  hasProject,
  onOpenVersionHistory,
  onOpenProfile,
  onOpenLanguageDialog,
  onSave,
  canSave,
}: Props): React.Node => {
  useVfLanguage();
  const { isMobile } = useResponsiveWindowSize();
  const { limits } = React.useContext(AuthenticatedUserContext);
  const tabs = getTabsToDisplay({ limits });

  return (
    <I18n>
      {({ i18n }) => (
        <div style={{ ...styles.bar, ...(isMobile ? styles.barMobile : {}) }}>
          <div style={styles.group}>
            {!isMobile && (
              <div style={styles.brand}>
                <GDevelopGLogo style={styles.brandMark} />
                <span style={styles.brandName}>VoxForge</span>
              </div>
            )}
          </div>
          {!isMobile && (
            <HomePageTopNav
              activeTab={activeTab}
              onSelect={tab => setActiveTab((tab: any))}
              items={tabs.map(({ tab, getIcon, id }) => ({
                id,
                tab,
                label: vf(tabLabels[tab] || tab),
                icon: getIcon({ color: 'inherit', fontSize: 'small' }),
              }))}
            />
          )}
          <div style={{ ...styles.group, ...styles.groupRight }}>
            <ExpandingActionButton
              primary
              id="home-create-project-button"
              label={vf('Новая игра')}
              icon={<AddIcon />}
              onClick={onCreateProject}
            />
            {canOpen && (
              <ExpandingActionButton
                label={vf('Открыть проект')}
                icon={<FolderIcon />}
                onClick={onChooseProject}
              />
            )}
            {!!hasProject && (
              <Line noMargin alignItems="center">
                <IconButton
                  size="small"
                  id="main-toolbar-history-button"
                  onClick={onOpenVersionHistory}
                  tooltip={t`Open version history`}
                  color="default"
                >
                  <HistoryIcon />
                </IconButton>
                <SaveProjectIcon
                  id="main-toolbar-save-button"
                  onSave={onSave}
                  canSave={canSave}
                />
              </Line>
            )}
            {!isMobile && <div style={styles.divider} />}
            {!isMobile && (
              <>
                <ExpandingActionButton
                  label={vf('Параметры')}
                  icon={<Preferences fontSize="small" />}
                  onClick={onOpenPreferences}
                />
                <ExpandingActionButton
                  label="О VoxForge"
                  icon={<GDevelopGLogo fontSize="small" />}
                  onClick={onOpenAbout}
                />
              </>
            )}
            <QuorvoxProfileChip />
            {isMobile ? (
              <IconButton size="small" onClick={onOpenLanguageDialog}>
                <TranslateIcon fontSize="small" />
              </IconButton>
            ) : (
              <TextButton
                label={i18n.language.toUpperCase()}
                onClick={onOpenLanguageDialog}
                icon={<TranslateIcon fontSize="small" />}
              />
            )}
          </div>
        </div>
      )}
    </I18n>
  );
};

// Подписи навигации (строки, а не <Trans>), чтобы кнопка могла показать их в
// aria-label и title.
const tabLabels: { [tab: string]: string } = {
  create: 'Проекты',
  learn: 'Обучение',
};
