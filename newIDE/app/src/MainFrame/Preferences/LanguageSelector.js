// @flow
import { Trans } from '@lingui/macro';

import React, { useContext } from 'react';
import SelectOption from '../../UI/SelectOption';
import { Column } from '../../UI/Grid';
import Window from '../../Utils/Window';
import PreferencesContext from './PreferencesContext';
import LocalesMetadata from '../../locales/LocalesMetadata';
import ExtensionLocalesMetadata from '../../locales/ExtensionLocalesMetadata';
import Text from '../../UI/Text';
import { LineStackLayout } from '../../UI/Layout';
import CompactSelectField from '../../UI/CompactSelectField';

type Props = {|
  onLanguageChanged: (language: string) => void,
|};

// VoxForge: языки интерфейса, которые мы поддерживаем (английский — основной,
// он в списке отдельным пунктом). Чтобы добавить язык, допиши его код сюда.
const SUPPORTED_LANGUAGE_CODES = [
  'ru_RU',
  'de_DE',
  'uk_UA',
  'pl_PL',
  'es_ES',
  'fr_FR',
  'tr_TR',
  'pt_BR',
  'ko_KR',
];

// $FlowFixMe[missing-local-annot]
const displayLocaleMetadata = localeMetadata => {
  if (localeMetadata.languageCode === 'en') return false;
  if (localeMetadata.languageCode === 'pseudo_LOCALE') return Window.isDev();

  return SUPPORTED_LANGUAGE_CODES.includes(localeMetadata.languageCode);
};

const localesToDisplay = LocalesMetadata.filter(displayLocaleMetadata).map(
  localeMetadata => {
    const extensionLocaleMetadata = ExtensionLocalesMetadata.find(
      extensionLocaleMetadata =>
        extensionLocaleMetadata.languageCode === localeMetadata.languageCode
    );
    const editorTranslationRatio = localeMetadata.translationRatio || 0;
    // We do a simple 50/50 split between the main GDevelop locales and the extension locales.
    // This is not perfect, but gives a rough idea of the translation progress.
    const translationRatioExtension = extensionLocaleMetadata
      ? extensionLocaleMetadata.translationRatio
      : 0;

    const translationRatio =
      (editorTranslationRatio + translationRatioExtension) / 2;
    return {
      ...localeMetadata,
      translationRatio,
    };
  }
);
const goodProgressLocales = localesToDisplay.filter(
  localeMetadata => localeMetadata.translationRatio > 0.3
);
const incompleteLocales = localesToDisplay.filter(
  localeMetadata => localeMetadata.translationRatio < 0.3
);

// $FlowFixMe[missing-local-annot]
const renderLanguageSelectOption = localeMetadata => {
  const translationRatio = localeMetadata.translationRatio || 0;
  const percent = (100 * localeMetadata.translationRatio).toFixed(0);
  const isIncomplete = translationRatio < 0.3;
  const isStarted = translationRatio > 0;

  const label = !isIncomplete
    ? `${localeMetadata.languageNativeName} (${localeMetadata.languageName})`
    : `${localeMetadata.languageNativeName} (${
        localeMetadata.languageName
      } - ${percent}% translated)`;

  return (
    <SelectOption
      value={localeMetadata.languageCode}
      label={label}
      disabled={!isStarted}
      key={localeMetadata.languageCode}
    />
  );
};

/**
 * The select field listing the available languages, to be placed in a
 * settings row or in a layout of your choice.
 */
export const LanguageSelectField = ({
  onLanguageChanged,
}: Props): React.Node => {
  const { values, setLanguage } = useContext(PreferencesContext);

  return (
    <CompactSelectField
      value={values.language}
      onChange={(value: string) => {
        setLanguage(value);
        onLanguageChanged(value);
      }}
    >
      <SelectOption value="en" label="English (default)" />
      {goodProgressLocales.map(localeMetadata =>
        renderLanguageSelectOption(localeMetadata)
      )}
      {incompleteLocales.map(localeMetadata =>
        renderLanguageSelectOption(localeMetadata)
      )}
    </CompactSelectField>
  );
};

const LanguageSelector = ({ onLanguageChanged }: Props): React.Node => {
  return (
    <Column noMargin>
      <LineStackLayout noMargin alignItems="center">
        <Column noMargin expand>
          <Text noMargin>
            <Trans>Choose GDevelop language</Trans>
          </Text>
        </Column>
        <Column noMargin expand>
          <LanguageSelectField onLanguageChanged={onLanguageChanged} />
        </Column>
      </LineStackLayout>
    </Column>
  );
};

export default LanguageSelector;
