import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

// VoxForge: значок «</>» — открыть проект в редакторе кода.
export default React.memo(props => (
  <SvgIcon {...props} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 3 7 13"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SvgIcon>
));
