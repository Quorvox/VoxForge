// @flow
// VoxForge: открывает «Режим кода» по событию 'vf-open-code-mode' (его шлёт
// кнопка в верхнем тулбаре).
import * as React from 'react';
import CodeModeDialog from './CodeModeDialog';

export const OPEN_CODE_MODE_EVENT = 'vf-open-code-mode';

export const requestOpenCodeMode = () => {
  window.dispatchEvent(new Event(OPEN_CODE_MODE_EVENT));
};

type Props = {|
  project: ?gdProject,
  fileIdentifier: ?string,
  onRun: () => void,
|};

const CodeModeHost = ({
  project,
  fileIdentifier,
  onRun,
}: Props): React.Node => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const listener = () => setOpen(true);
    window.addEventListener(OPEN_CODE_MODE_EVENT, listener);
    return () => window.removeEventListener(OPEN_CODE_MODE_EVENT, listener);
  }, []);

  if (!open || !project) return null;
  return (
    <CodeModeDialog
      project={project}
      fileIdentifier={fileIdentifier}
      onClose={() => setOpen(false)}
      onRun={onRun}
    />
  );
};

export default CodeModeHost;
