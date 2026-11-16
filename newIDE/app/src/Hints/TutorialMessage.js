// @flow
import * as React from 'react';
import { type Tutorial } from '../Utils/GDevelopServices/Tutorial';

type Props = {|
  tutorial: Tutorial,
|};

/**
 * VoxForge: плашки с туториалами GDevelop (видео на их сайте) не показываем.
 * Компонент оставлен, чтобы не править десятки мест, где он вставлен; свои
 * уроки появятся в разделе «Обучение».
 */
const TutorialMessage = (props: Props): React.Node => null;

export default TutorialMessage;
