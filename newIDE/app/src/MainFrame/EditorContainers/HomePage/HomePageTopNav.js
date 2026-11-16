// @flow
import * as React from 'react';
import classNames from 'classnames';
import classes from './HomePageTopNav.module.css';

export type TopNavItem = {|
  id: string,
  tab: string,
  label: string,
  icon: React.Node,
|};

type Props = {|
  items: Array<TopNavItem>,
  activeTab: string,
  onSelect: (tab: string) => void,
|};

/**
 * VoxForge: главная навигация по центру верхней панели. Стеклянная «капсула»,
 * внутри — кнопки; подсветка активного пункта плавно переезжает с места на
 * место, а не «прыгает».
 */
const HomePageTopNav = ({ items, activeTab, onSelect }: Props): React.Node => {
  const containerRef = React.useRef<?HTMLDivElement>(null);
  const buttonRefs = React.useRef<{ [tab: string]: ?HTMLButtonElement }>({});
  const [indicator, setIndicator] = React.useState<?{|
    left: number,
    width: number,
  |}>(null);

  const measure = React.useCallback(
    () => {
      const container = containerRef.current;
      const button = buttonRefs.current[activeTab];
      if (!container || !button) {
        setIndicator(null);
        return;
      }
      setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    },
    [activeTab]
  );

  React.useLayoutEffect(measure, [measure, items.length]);

  React.useEffect(
    () => {
      window.addEventListener('resize', measure);
      // Шрифт грузится позже первой отрисовки и меняет ширину кнопок.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measure);
      }
      return () => window.removeEventListener('resize', measure);
    },
    [measure]
  );

  return (
    <div className={classes.nav} ref={containerRef} role="tablist">
      {indicator && (
        <span
          className={classes.indicator}
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      )}
      {items.map(item => (
        <button
          key={item.id}
          id={item.id}
          type="button"
          role="tab"
          aria-selected={activeTab === item.tab}
          ref={element => {
            buttonRefs.current[item.tab] = element;
          }}
          className={classNames(classes.item, {
            [classes.itemActive]: activeTab === item.tab,
          })}
          onClick={() => onSelect(item.tab)}
        >
          <span className={classes.icon}>{item.icon}</span>
          <span className={classes.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default HomePageTopNav;
