// @flow
import { Trans } from '@lingui/macro';

import React from 'react';
import { List, ListItem } from '../UI/List';
import Dialog from '../UI/Dialog';
import FlatButton from '../UI/FlatButton';
import { Tabs } from '../UI/Tabs';
import { Column, Line } from '../UI/Grid';
import Window from '../Utils/Window';
import Text from '../UI/Text';
import PreferencesContext from './Preferences/PreferencesContext';
import {
  getElectronUpdateStatusLabel,
  getElectronUpdateButtonLabel,
  canDownloadElectronUpdate,
  type ElectronUpdateStatus,
  useServiceWorkerUpdateStatus,
  getServiceWorkerStatusLabel,
} from './UpdaterTools';
import { getIDEVersion, getVoxForgeVersion } from '../Version';
import { ColumnStackLayout } from '../UI/Layout';
import optionalRequire from '../Utils/OptionalRequire';
import ErrorBoundary from '../UI/ErrorBoundary';
import GDevelopGLogo from '../UI/CustomSvgIcons/GDevelopGLogo';
import { vf } from '../Utils/i18n/vfStrings';
const electron = optionalRequire('electron');

type Props = {|
  open?: boolean,
  onClose: () => void,
  updateStatus: ElectronUpdateStatus,
|};

type TabName = 'about' | 'credits';

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    padding: '26px 30px',
    borderRadius: 4,
    border: '1px solid var(--theme-dialog-separator-color)',
    background:
      'radial-gradient(circle at 12% 50%, rgba(255, 138, 61, 0.22), rgba(255, 138, 61, 0) 55%), var(--theme-surface-alternate-canvas-background-color)',
  },
  bannerFox: {
    width: 96,
    height: 96,
    fontSize: 96,
    flexShrink: 0,
  },
  bannerName: {
    fontFamily: "'Unbounded', var(--gdevelop-modern-font-family)",
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: '40px',
    color: 'var(--theme-text-default-color)',
  },
  bannerTagline: {
    marginTop: 6,
    fontFamily: 'var(--gdevelop-modern-font-family)',
    fontSize: 15,
    color: 'var(--theme-text-secondary-color)',
  },
};

// There must be missing tons of people.
// If you contributed to GDevelop but you're not in the list, please
// send a Pull Request on GitHub or open an issue ;)
const contributors = [
  // Core development team
  {
    name: 'Clément Pasteau',
    description: 'Core development team',
    link: 'https://github.com/ClementPasteau',
  },
  {
    name: 'AlexandreSi',
    description: 'Core development team',
    link: 'https://github.com/AlexandreSi',
  },
  // Code contributors
  {
    name: 'Victor Levasseur',
    description:
      'Numerous code contributions to GDevelop and community moderation',
  },
  {
    name: 'Lizard-13',
    description:
      'Numerous code contributions to GDevelop and community moderation',
  },
  {
    name: "Christina 'Castpixel' Antoinette Neofotistou",
    description: 'Art and assets for the 8-bit Space Shooter example.',
    link: 'https://www.patreon.com/castpixel',
  },
  { name: 'ale26reg', description: 'Contributions to GDevelop' },
  { name: 'dos1', description: 'Contributions to GDevelop' },
  {
    name: 'Aurélien Vivet',
    description:
      'Numerous code contributions to GDevelop and community management',
    link: 'https://www.witly.fr',
  },
  {
    name: 'Todor Imreorov',
    description: 'Numerous code contributions to GDevelop',
  },
  { name: 'brylie', description: 'Contributions to GDevelop' },
  { name: 'Nnarol', description: 'Contributions to GDevelop' },
  { name: 'wild-master', description: 'Contributions to GDevelop' },
  { name: 'RandomShaper', description: 'Contributions to GDevelop' },
  { name: 'RyanNerd', description: 'Contributions to GDevelop' },
  { name: 'greater', description: 'Contributions to GDevelop' },
  { name: 'triptych', description: 'Contributions to GDevelop' },
  {
    name: 'Wend1go',
    description: 'Contributions to GDevelop, Tutorials, Examples',
  },
  { name: 'mattiascibien', description: 'Contributions to GDevelop' },
  { name: 'araujo921', description: 'Contributions to GDevelop' },
  { name: 'ronnystandtke', description: 'Contributions to GDevelop' },
  {
    name: 'Thomas Flecy',
    description: 'Contributions to GDevelop (original sound object extension)',
  },
  {
    name: 'Arthur Pacaud (arthuro555)',
    description:
      'Numerous code contributions to GDevelop and community moderation',
    link: 'https://forum.gdevelop.io/u/arthuro555/summary',
  },
  {
    name: 'The Gem Dev',
    description: 'Code contributions to GDevelop and tutorials on Youtube',
    link: 'https://www.youtube.com/channel/UCsZ4Ue8c94YLJDbGRafCI5Q',
  },
  {
    name: 'D8H',
    description: 'Numerous code contributions to GDevelop',
    link: 'https://github.com/D8H',
  },
  {
    name: 'Harsimran Singh Virk',
    description: 'Numerous code contributions to GDevelop',
    link: 'https://github.com/HarsimranVirk',
  },
  {
    name: 'Nilay Majorwar',
    description: 'Numerous code contributions to GDevelop',
    link: 'https://github.com/nilaymaj',
  },

  // Community members:
  {
    name: 'ddabrahim',
    description: 'Examples for GDevelop',
    link: 'https://gametemplates.itch.io/',
  },
  {
    name: 'Gametemplates',
    description: 'Examples bundled with GDevelop',
    link: 'https://gametemplates.itch.io/',
  },
  { name: 'Mats', description: 'Tutorials, Examples' },
  { name: 'erdo', description: 'Tutorials, Examples' },
  { name: 'Jubileuksen3', description: 'Tutorials, Examples' },
  { name: 'LucaTexas', description: 'Tutorials, Examples' },
  { name: 'Kink', description: 'Forum moderator, tutorials, Examples' },
  { name: 'RicoTrooper', description: 'Tutorials' },
  { name: 'kalel', description: 'Tutorials' },
  { name: 'mtarzaim', description: 'Tutorials' },
  { name: 'Darkhog', description: 'Examples' },
  { name: 'Ricardo Graca', description: 'Tutorials, Examples' },
  { name: 'Diego Schiavon', description: 'Indiegogo Ubuntu contributor' },
  { name: 'conceptgame', description: 'Indiegogo super contributor' },
  {
    name: 'Jose David Cuartas Correa',
    description:
      'Author of Digitopolis (a book on how to make games with GDevelop 4)',
  },

  {
    name: 'François Dumortier',
    description: 'GDevelop logo design',
    link: 'http://www.fdumortier.com',
  },
  {
    name: 'Constantine Shvetsov',
    description: 'Design of all the awesome icons',
  },
  {
    name: 'MillionthVector',
    description: 'Assets of various examples',
  },
  {
    name: 'Tristan Rhodes (Victris Games)',
    description: 'High quality extensions for GDevelop',
    link: 'https://www.youtube.com/channel/UClbq1M-D83t_bYhfa1mfyEQ',
  },
  {
    name: 'Entropy',
    description: 'High quality extensions and art packs for GDevelop',
    link: 'https://github.com/Entr0py404',
  },
  {
    name: 'FlokiTV',
    description: 'High quality extensions for GDevelop',
    link: 'https://github.com/FlokiTV',
  },
  {
    name: 'Silver-Streak',
    description:
      'Examples, bug reports, testing of new features, providing community support to users, community moderation',
    link: 'https://github.com/Silver-Streak',
  },
  {
    name: 'Jurfix',
    description: 'Discord moderation',
    link: 'https://github.com/Jurfix',
  },
  {
    name: 'Wishforge Games',
    description: 'Making high quality tutorials',
    link: 'https://www.wishforge.games/',
  },
  {
    name: 'Sleeper Games',
    description: 'Making the game feel starter',
    link: 'https://twitter.com/Sleeper_Games',
  },
  {
    name: 'VegeTato',
    description: 'Extensions for GDevelop',
    link: 'https://twitter.com/VegeTato_',
  },
  {
    name: 'Leo Red',
    description: 'Reviewing examples submissions',
    link: 'https://github.com/Midhil457',
  },
  {
    name: 'add_',
    description: 'Extensions for GDevelop',
    link: 'https://github.com/add00',
  },
  {
    name: 'HelperWesley',
    description: 'Examples and youtube content that is relevant to GDevelop',
    link: 'https://www.youtube.com/channel/UC8RsU74-hU1pfNKHNMfiFfw',
  },
  {
    name: 'UlisesFreitas',
    description:
      'Numerous examples and making external services that integrate with GDevelop games',
    link: 'https://ulisesfreitas.itch.io/',
  },
  {
    name: 'IttaloXD',
    description: 'The GDevelop embassador in Brazil',
    link: 'https://twitter.com/ittaloxd',
  },
  {
    name: 'PANDAKO',
    description: 'Translations in Japanese, extensions and blog',
    link: 'https://gdevelop-jp.blogspot.com',
  },
  {
    name: 'Reptile',
    description: 'Translation in Polish',
  },
];

const AboutDialog = ({ onClose, updateStatus }: Props) => {
  const openLink = React.useCallback((link: string) => {
    if (!link) return;

    Window.openExternalURL(link);
  }, []);

  const [currentTab, setCurrentTab] = React.useState<TabName>('about');

  const { checkUpdates } = React.useContext(PreferencesContext);

  // Electron update status
  const electronUpdateStatusString = getElectronUpdateStatusLabel(
    updateStatus.status
  );
  const electronUpdateButtonLabel = getElectronUpdateButtonLabel(
    updateStatus.status
  );

  // Web-app (service-worker) update status
  const serviceWorkerUpdateStatus = useServiceWorkerUpdateStatus();

  return (
    <Dialog
      title="О VoxForge"
      actions={[
        <FlatButton
          key="website"
          label={vf('Сайт VoxForge')}
          primary={false}
          onClick={() => Window.openExternalURL('https://quorvox.github.io')}
        />,
        <FlatButton
          key="close"
          label={vf('Закрыть')}
          primary={false}
          onClick={onClose}
        />,
      ]}
      onRequestClose={onClose}
      open
      maxWidth="sm"
      fixedContent={
        <ColumnStackLayout noMargin>
          <div style={styles.banner}>
            <GDevelopGLogo style={styles.bannerFox} />
            <div>
              <div style={styles.bannerName}>VoxForge</div>
              <div style={styles.bannerTagline}>
                {vf('Собери игру. Выпусти её везде.')}
              </div>
            </div>
          </div>
          <Tabs
            value={currentTab}
            onChange={setCurrentTab}
            options={[
              { value: 'about', label: vf('О программе') },
              { value: 'credits', label: vf('Основа') },
            ]}
          />
        </ColumnStackLayout>
      }
    >
      {currentTab === 'about' && (
        <Line>
          <ColumnStackLayout>
            <Text>
              {vf(
                'VoxForge — игровой движок с открытым кодом. Делай 2D и 3D игры и публикуй их для Windows, Android и веба.'
              )}
            </Text>
            <Text allowSelection>
              {vf('Версия:')} v{getVoxForgeVersion()}
            </Text>
            <Text size="sub-title">{vf('Обновления')}</Text>
            {!!electron && electronUpdateStatusString ? (
              <ColumnStackLayout noMargin>
                <Text>{electronUpdateStatusString}</Text>
                <FlatButton
                  label={electronUpdateButtonLabel}
                  onClick={() =>
                    checkUpdates(canDownloadElectronUpdate(updateStatus.status))
                  }
                />
              </ColumnStackLayout>
            ) : (
              <Text>{vf('Сведений об обновлениях нет.')}</Text>
            )}
            {!electron && (
              <Text>
                {getServiceWorkerStatusLabel(serviceWorkerUpdateStatus)}
              </Text>
            )}
          </ColumnStackLayout>
        </Line>
      )}
      {currentTab === 'credits' && (
        <React.Fragment>
          <Column>
            <Text>
              {vf('VoxForge построен на открытом движке GDevelop')}{' '}
              {getIDEVersion()}{' '}
              {vf(
                '(лицензия MIT). GDevelop создал Флориан «4ian» Рив, ниже — люди, которые вложились в исходный проект.'
              )}
            </Text>
            <FlatButton
              label={vf('Исходный проект GDevelop')}
              onClick={() => openLink('https://github.com/4ian/GDevelop')}
            />
          </Column>
          <List>
            {contributors.map(contributor => (
              <ListItem
                key={contributor.name}
                primaryText={contributor.name}
                secondaryText={contributor.description}
                secondaryTextLines={contributor.description.length < 30 ? 1 : 2}
                displayLinkButton={contributor.link ? true : false}
                onOpenLink={() => openLink(contributor.link || '')}
              />
            ))}
          </List>
        </React.Fragment>
      )}
    </Dialog>
  );
};

const AboutDialogWithErrorBoundary = (props: Props): React.Node => (
  <ErrorBoundary
    componentTitle={<Trans>About dialog</Trans>}
    scope="about"
    onClose={props.onClose}
  >
    <AboutDialog {...props} />
  </ErrorBoundary>
);

export default AboutDialogWithErrorBoundary;
