import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

/**
 * Лис VoxForge: гранёная морда, оранжевый с фиолетовым и белой мордой.
 * Файл называется по-старому, чтобы не переписывать все места, где
 * использовалась иконка «G» от GDevelop. Цвета зашиты в сам рисунок и не
 * зависят от темы (это марка, а не иконка). Грани плоские, без градиентов:
 * так нет конфликтов id при нескольких копиях на странице, и рисунок
 * читается даже в 16px. Исходник: branding/voxforge-fox.svg.
 */
const Half = () => (
  <g>
    {/* ухо: фиолетовый край, оранжевая внутренность, тёмный кончик */}
    <polygon points="100,30 46,252 184,164" fill="#6a37a3" />
    <polygon points="104,92 80,226 166,172" fill="#ff8a2b" />
    <polygon points="100,30 88,100 128,92" fill="#3b1d63" />
    {/* лоб и висок */}
    <polygon points="184,164 256,170 256,292 170,262" fill="#ff9a35" />
    <polygon points="46,252 184,164 170,262 142,334 52,330" fill="#f0641d" />
    <polygon points="52,330 142,334 118,432 70,394" fill="#8a4ac6" />
    <polygon points="142,334 198,412 150,452 118,432" fill="#5a2d8f" />
    <polygon points="256,170 234,234 256,292" fill="#ffc24b" />
    {/* подводка глаза */}
    <polygon points="140,274 214,298 160,302" fill="#3b1d63" opacity="0.9" />
    {/* белая щека */}
    <polygon points="142,334 176,316 212,410 198,412" fill="#efe8f8" />
    <polygon points="176,316 196,316 212,410" fill="#ffffff" />
    {/* глаз */}
    <polygon points="148,284 210,302 190,326 158,312" fill="#1c1030" />
    <polygon points="184,298 202,304 192,314" fill="#ffffff" />
  </g>
);

export default React.memo(props => (
  <SvgIcon {...props} viewBox="21 20 470 470" aria-label="VoxForge">
    <Half />
    <g transform="translate(512,0) scale(-1,1)">
      <Half />
    </g>
    {/* морда и нос по центру */}
    <polygon points="196,316 256,288 316,316 300,410 256,474 212,410" fill="#ffffff" />
    <polygon points="256,288 316,316 300,410 256,474" fill="#e9e1f4" />
    <polygon
      points="256,330 292,372 256,474 220,372"
      fill="#f7f3fc"
      opacity="0.55"
    />
    <polygon points="232,386 280,386 256,416" fill="#25132f" />
  </SvgIcon>
));
