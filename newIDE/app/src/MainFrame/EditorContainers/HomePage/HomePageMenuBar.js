// @flow
import * as React from 'react';
import { Trans } from '@lingui/macro';
import { Column, marginsSize } from '../../../UI/Grid';
import { useResponsiveWindowSize } from '../../../UI/Responsive/ResponsiveWindowMeasurer';
import IconButton from '../../../UI/IconButton';
import DoubleChevronArrowRight from '../../../UI/CustomSvgIcons/DoubleChevronArrowRight';
import VerticalTabButton, {
  verticalTabButtonSize,
} from '../../../UI/VerticalTabButton';
import Preferences from '../../../UI/CustomSvgIcons/Preferences';
import GDevelopGLogo from '../../../UI/CustomSvgIcons/GDevelopGLogo';
import GDevelopThemeContext from '../../../UI/Theme/GDevelopThemeContext';
import Paper from '../../../UI/Paper';
import {
  type HomeTab,
  type GetIconFunction,
  getTabsToDisplay,
} from './HomePageMenu';
import { Toolbar, ToolbarGroup } from '../../../UI/Toolbar';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import { SECTION_DESKTOP_SPACING } from './SectionContainer';
import Text from '../../../UI/Text';

const iconSize = 24;
const iconButtonPadding = 4;
/**
 * Padding bottom is bigger than padding top to leave space for the Android/iOS
 * bottom navigation bar.
 */
const iconButtonMarginBottom = 12;
const iconButtonLabelSize = 20;
export const homepageMobileMenuHeight =
  iconSize +
  iconButtonLabelSize +
  2 * iconButtonPadding +
  iconButtonMarginBottom;
export const homepageDesktopMenuBarWidth = 230;
export const homepageMediumMenuBarWidth =
  verticalTabButtonSize + 2 * marginsSize;

export const styles = {
  desktopMenu: {
    paddingTop: SECTION_DESKTOP_SPACING, // To align with the top of the sections
    paddingBottom: 10,
    minWidth: homepageDesktopMenuBarWidth,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileMenu: {
    paddingTop: 10,
    paddingBottom: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileContainer: {
    width: '100%',
    fontSize: iconSize,
    height: homepageMobileMenuHeight,
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  // VoxForge: марка и название сверху боковой панели.
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '2px 10px 18px 10px',
  },
  brandMark: {
    width: 28,
    height: 28,
    color: 'var(--theme-primary-color)',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '0.01em',
    color: 'var(--theme-text-default-color)',
  },
  bottomButtonsContainer: {
    marginBottom: 'var(--safe-area-inset-bottom)',
  },
  mobileButton: {
    padding: iconButtonPadding,
    marginBottom: iconButtonMarginBottom,
    fontSize: 'inherit',
  },
  icon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 2,
  },
};

type Props = {|
  setActiveTab: HomeTab => void,
  activeTab: HomeTab,
  onOpenPreferences: () => void,
  onOpenAbout: () => void,
  onOpenHomePageMenuDrawer: () => void,
|};

const HomePageMenuBar = ({
  setActiveTab,
  activeTab,
  onOpenPreferences,
  onOpenAbout,
  onOpenHomePageMenuDrawer,
}: Props): React.Node => {
  const { isMobile, isMediumScreen } = useResponsiveWindowSize();
  const isMobileOrSmallScreen = isMobile || isMediumScreen;
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const { limits } = React.useContext(AuthenticatedUserContext);
  const tabsToDisplay = getTabsToDisplay({ limits });
  const largeScreenOnlyButtons: {
    label: React.Node,
    getIcon: GetIconFunction,
    id: string,
    onClick: () => void,
  }[] = [
    {
      label: <Trans>Preferences</Trans>,
      id: 'settings',
      onClick: onOpenPreferences,
      getIcon: ({ color, fontSize }) => (
        <Preferences fontSize={fontSize} color={color} />
      ),
    },
    {
      label: <Trans>About GDevelop</Trans>,
      id: 'about-gdevelop',
      onClick: onOpenAbout,
      getIcon: ({ color, fontSize }) => (
        <GDevelopGLogo fontSize={fontSize} color={color} />
      ),
    },
  ];

  if (isMobile) {
    return (
      <Paper
        background="medium"
        square
        style={{
          ...styles.mobileContainer,
          borderTop: `1px solid ${gdevelopTheme.home.separator.color}`,
        }}
      >
        <Toolbar height={homepageMobileMenuHeight}>
          <ToolbarGroup spaceOut>
            {tabsToDisplay.map(({ label, tab, getIcon, id }) => {
              const isActive = activeTab === tab;
              return (
                <div
                  style={{
                    ...styles.buttonContainer,
                    borderTop: `3px solid ${
                      isActive
                        ? gdevelopTheme.iconButton.selectedBackgroundColor
                        : // Always keep the border so there's no layout shift.
                          'transparent'
                    }`,
                    ...(!isActive
                      ? { color: gdevelopTheme.text.color.secondary }
                      : {}),
                  }}
                  key={id}
                >
                  {/* $FlowFixMe[incompatible-type] */}
                  <IconButton
                    color="inherit"
                    disableRipple
                    disableFocusRipple
                    disableHover
                    style={styles.mobileButton}
                    onClick={() => {
                      setActiveTab(tab);
                    }}
                    selected={false}
                    id={id}
                  >
                    <Column noMargin>
                      <span style={styles.icon}>
                        {getIcon({
                          color: 'inherit',
                          fontSize: 'inherit',
                        })}
                      </span>
                      <Text size="body-small" color="inherit" noMargin>
                        {label}
                      </Text>
                    </Column>
                  </IconButton>
                </div>
              );
            })}
          </ToolbarGroup>
        </Toolbar>
      </Paper>
    );
  }

  // VoxForge: на десктопе левой панели больше нет — навигация в верхней
  // панели (см. HomePageHeader). На телефоне остаётся нижняя панель выше.
  return null;
};

export default HomePageMenuBar;
