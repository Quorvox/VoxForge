// @flow
import { ThemeProvider, createMuiTheme } from '@material-ui/core';
import { StylesProvider, jssPreset } from '@material-ui/core/styles';
import * as React from 'react';
import { getFullTheme } from '.';
import { create } from 'jss';
import rtl from 'jss-rtl';
import GDevelopThemeContext from './GDevelopThemeContext';
import PreferencesContext from '../../MainFrame/Preferences/PreferencesContext';
import { useResponsiveWindowSize } from '../Responsive/ResponsiveWindowMeasurer';
import PortalContainerContext from '../PortalContainerContext';
import {
  ACCENTS,
  applyAccent,
  getStoredAccentId,
  recolorValue,
  subscribeToAccentChange,
} from './Accent';

// Add the rtl plugin to the JSS instance to support RTL languages in material-ui components.
const jss = create({
  plugins: [...jssPreset().plugins, rtl()],
});

/**
 * Create a JSS instance that injects <style> elements into the given
 * document's <head> instead of the main window's document.
 * This is needed when rendering MUI components inside a separate browser
 * window (via WindowPortal) so that styles are actually applied there.
 */
const createJssForDocument = (targetDocument: Document) => {
  // Create a comment node as the insertion point so JSS injects styles
  // into the target document's head.
  const insertionPoint = targetDocument.createComment('jss-insertion-point');
  if (targetDocument.head) {
    targetDocument.head.appendChild(insertionPoint);
  }

  return create({
    plugins: [...jssPreset().plugins, rtl()],
    // $FlowFixMe[incompatible-type] - insertionPoint is a Comment node but accepted by JSS.
    insertionPoint,
  });
};

/**
 * Given a portal container element (from PortalContainerContext),
 * return MUI theme `props` overrides so that all overlay components
 * (Modal, Dialog, Popover, Menu, Tooltip, Drawer, Popper) render
 * inside the given container instead of document.body.
 *
 * When portalContainer is undefined/null, returns an empty object
 * (default MUI behavior).
 */
const getPortalContainerThemeProps = (portalContainer: ?HTMLElement) => {
  if (!portalContainer) return {};
  return {
    MuiModal: { container: portalContainer },
    MuiPopover: { container: portalContainer },
    MuiMenu: { container: portalContainer },
    MuiDrawer: { container: portalContainer },
    MuiTooltip: {
      // Replaced by any Tooltip passing its own PopperProps: those must also set the container.
      PopperProps: { container: portalContainer },
    },
  };
};

/**
 * VoxForge: подкрашивает MUI-тему выбранным акцентом. Общий хук для обоих
 * провайдеров темы (основного и вложенного в панель вкладок).
 */
const useAccentedMuiTheme = (baseMuiTheme: any, enabled: boolean): any => {
  const [accentId, setAccentId] = React.useState<string>(getStoredAccentId());
  React.useEffect(
    () => subscribeToAccentChange(() => setAccentId(getStoredAccentId())),
    []
  );
  return React.useMemo(
    () => {
      const accent = ACCENTS.find(item => item.id === accentId);
      if (!enabled || !accent || accent.hue === null) return baseMuiTheme;
      const hue = accent.hue;
      const recolorPalette = palette => ({
        ...palette,
        light: recolorValue(palette.light, hue),
        main: recolorValue(palette.main, hue),
        dark: recolorValue(palette.dark, hue),
      });
      return createMuiTheme(baseMuiTheme, {
        palette: {
          primary: recolorPalette(baseMuiTheme.palette.primary),
          secondary: recolorPalette(baseMuiTheme.palette.secondary),
        },
      });
    },
    [baseMuiTheme, accentId, enabled]
  );
};

type MuiThemeProviderProps = {|
  children: React.Node,
|};

/**
 * Allow to override the Material-UI theme for a specific subtree.
 * Useful for panes which are having a different "responsive window size"
 * than the rest of the application.
 */
export const MuiThemeOnlyProvider = ({
  children,
}: MuiThemeProviderProps): React.Node => {
  const { values } = React.useContext(PreferencesContext);
  const { themeName, language } = values;
  const { isMobile } = useResponsiveWindowSize();

  const theme = React.useMemo(
    () => {
      const fullTheme = getFullTheme({
        themeName,
        language,
        isMobile,
      });

      return fullTheme;
    },
    [themeName, language, isMobile]
  );

  const muiTheme = useAccentedMuiTheme(theme.muiTheme, true);
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
};

type Props = {|
  children: React.Node,
  forcedThemeName?: string,
|};

export const FullThemeProvider = ({
  children,
  forcedThemeName,
}: Props): React.Node => {
  const { values } = React.useContext(PreferencesContext);
  const { themeName, language } = values;
  const { isMobile } = useResponsiveWindowSize();
  const portalContainer = React.useContext(PortalContainerContext);

  const themeNameToUse = forcedThemeName || themeName;

  const theme = React.useMemo(
    () => {
      const fullTheme = getFullTheme({
        themeName: themeNameToUse,
        language,
        isMobile,
      });

      try {
        const { body } = document;
        if (!body) throw new Error('Document has no body.');
        body.className = fullTheme.gdevelopTheme.uiRootClassName;
      } catch (error) {
        console.error('An error occurred while changing global theme:', error);
      }

      return fullTheme;
    },
    [themeNameToUse, language, isMobile]
  );

  // VoxForge: цвет акцента поверх темы (пересчёт переменных на <body>).
  const [accentId, setAccentId] = React.useState<string>(getStoredAccentId());
  React.useEffect(
    () => subscribeToAccentChange(() => setAccentId(getStoredAccentId())),
    []
  );
  React.useEffect(
    () => {
      if (forcedThemeName) return;
      applyAccent(accentId);
    },
    [theme, accentId, forcedThemeName]
  );

  // When rendering inside a popped-out window (PortalContainerContext is set),
  // inject default `container` props into the MUI theme so all overlay
  // components (Dialog, Menu, Tooltip, Popover, Drawer) render into the
  // correct window rather than the main window's document.body.
  const portalContainerThemeProps = React.useMemo(
    () => getPortalContainerThemeProps(portalContainer),
    [portalContainer]
  );

  const accentedMuiTheme = useAccentedMuiTheme(
    theme.muiTheme,
    !forcedThemeName
  );
  const muiTheme = React.useMemo(
    () => {
      if (!portalContainer) return accentedMuiTheme;

      // Merge portal container props into the existing theme.
      return {
        ...accentedMuiTheme,
        props: {
          ...accentedMuiTheme.props,
          ...portalContainerThemeProps,
        },
      };
    },
    [accentedMuiTheme, portalContainer, portalContainerThemeProps]
  );

  // When rendering inside a popped-out window, create a JSS instance that
  // targets the child window's document so styles are injected there.
  const portalJss = React.useMemo(
    () => {
      if (!portalContainer) return null;
      const ownerDoc = portalContainer.ownerDocument;
      if (!ownerDoc || ownerDoc === document) return null;
      return createJssForDocument(ownerDoc);
    },
    [portalContainer]
  );

  return (
    <GDevelopThemeContext.Provider value={theme.gdevelopTheme}>
      <StylesProvider jss={portalJss || jss}>
        <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
      </StylesProvider>
    </GDevelopThemeContext.Provider>
  );
};
