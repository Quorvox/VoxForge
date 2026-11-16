// @flow
import * as React from 'react';
import SectionContainer, { SectionRow } from './SectionContainer';
import Window from '../../../Utils/Window';
import { vf, useVfLanguage } from '../../../Utils/i18n/vfStrings';

const styles = {
  heading: {
    fontFamily: "'Unbounded', var(--gdevelop-modern-font-family)",
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--theme-text-default-color)',
    margin: '0 0 14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    padding: '20px 22px',
    textAlign: 'left',
    cursor: 'pointer',
    border: '1px solid var(--vf-card-border)',
    borderRadius: 10,
    background: 'var(--vf-card-bg)',
    backdropFilter: 'blur(18px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 var(--vf-card-hilite)',
    color: 'var(--theme-text-default-color)',
    font: 'inherit',
  },
  title: {
    fontFamily: "'Unbounded', var(--gdevelop-modern-font-family)",
    fontSize: 16,
    fontWeight: 600,
  },
  text: {
    fontFamily: 'var(--gdevelop-modern-font-family)',
    fontSize: 14,
    lineHeight: '21px',
    color: 'var(--theme-text-secondary-color)',
  },
  open: {
    marginTop: 'auto',
    fontFamily: 'var(--gdevelop-modern-font-family)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--vf-accent, var(--theme-text-default-color))',
  },
};

type Props = {|
  onCreate: () => void,
|};

type Course = {|
  title: string,
  text: string,
  url?: string,
  onClick?: () => void,
|};

/**
 * Раздел «Обучение» VoxForge: ссылки на курсы команды Quorvox. Подписи —
 * русские ключи, переводятся через vf().
 */
const LearnPlaceholder = ({ onCreate }: Props): React.Node => {
  useVfLanguage();
  const courses: Array<Course> = [
    {
      title: 'Курс по Python',
      text: 'Бесплатный курс от команды Quorvox: с нуля до своих программ.',
      url: 'https://quorvox.github.io/python-course/#/',
    },
    {
      title: 'Работа с движком',
      text: 'Первая игра за вечер: сцены, объекты, события и запуск.',
      onClick: onCreate,
    },
  ];

  return (
    <SectionContainer flexBody>
      <SectionRow expand>
        <h2 style={styles.heading}>{vf('Курсы по программированию')}</h2>
        <div style={styles.grid}>
          {courses.map(course => (
            <button
              key={course.title}
              type="button"
              style={styles.card}
              onClick={() => {
                if (course.url) Window.openExternalURL(course.url);
                else if (course.onClick) course.onClick();
              }}
            >
              <span style={styles.title}>{vf(course.title)}</span>
              <span style={styles.text}>{vf(course.text)}</span>
              <span style={styles.open}>
                {vf(course.url ? 'Открыть' : 'Создать проект из шаблона')}
              </span>
            </button>
          ))}
        </div>
      </SectionRow>
    </SectionContainer>
  );
};

export default LearnPlaceholder;
