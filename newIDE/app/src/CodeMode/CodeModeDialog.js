// @flow
// VoxForge: режим кода. Все скрипты проекта (события «Код Python» и «Код
// JavaScript» из всех сцен) одним списком: слева файлы, по центру редактор,
// сверху запуск игры и кнопка «Открыть в VS Code».
import * as React from 'react';
import Dialog from '../UI/Dialog';
import FlatButton from '../UI/FlatButton';
import RaisedButton from '../UI/RaisedButton';
import Text from '../UI/Text';
import TextField from '../UI/TextField';
import { CodeEditor } from '../CodeEditor';
import UnsavedChangesContext from '../MainFrame/UnsavedChangesContext';
import { mapFor } from '../Utils/MapFor';
import {
  PYTHON_EVENT_TEMPLATE,
  getScriptName,
  setScriptName,
  unwrapPythonCode,
  wrapPythonCode,
} from '../EventsSheet/PythonEvent';
import { openProjectInVsCode } from '../ProjectsStorage/FolderStorageProvider/OpenInVsCode';

const gd: libGDevelop = global.gd;

const JS_CODE_EVENT_TYPE = 'BuiltinCommonInstructions::JsCode';

type ScriptItem = {|
  key: string,
  layoutName: string,
  id: string,
  event: gdBaseEvent,
  isPython: boolean,
  name: ?string,
|};

const collectFromEvents = (
  layoutName: string,
  events: gdEventsList,
  prefix: string,
  result: Array<ScriptItem>
) => {
  mapFor(0, events.getEventsCount(), index => {
    const event = events.getEventAt(index);
    const id = `${prefix}${index + 1}`;
    if (event.getType() === JS_CODE_EVENT_TYPE) {
      const code = gd.asJsCodeEvent(event).getInlineCode();
      result.push({
        key: `${layoutName}/${id}`,
        layoutName,
        id,
        event,
        isPython: unwrapPythonCode(code) !== null,
        name: getScriptName(
          unwrapPythonCode(code) !== null ? unwrapPythonCode(code) || '' : code
        ),
      });
    }
    if (event.canHaveSubEvents()) {
      collectFromEvents(layoutName, event.getSubEvents(), `${id}-`, result);
    }
  });
};

const collectScripts = (project: gdProject): Array<ScriptItem> => {
  const result = [];
  mapFor(0, project.getLayoutsCount(), index => {
    const layout = project.getLayoutAt(index);
    collectFromEvents(layout.getName(), layout.getEvents(), '', result);
  });
  return result;
};

const styles = {
  body: {
    display: 'flex',
    gap: 12,
    height: 'calc(100vh - 300px)',
    minHeight: 320,
  },
  list: {
    width: 230,
    flexShrink: 0,
    overflowY: 'auto',
    border: '1px solid var(--vf-card-border)',
    borderRadius: 8,
    background: 'var(--vf-card-bg)',
  },
  item: {
    display: 'flex',
    width: '100%',
    gap: 8,
    alignItems: 'center',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--theme-text-default-color)',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  itemSelected: {
    background: 'var(--vf-accent-soft, rgba(255,138,61,0.16))',
    boxShadow: 'inset 3px 0 0 var(--theme-primary-color)',
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: 4,
    background: 'rgba(128,128,128,0.25)',
  },
  editor: { flex: 1, minWidth: 0 },
  empty: { padding: 16, opacity: 0.7 },
};

type Props = {|
  project: gdProject,
  fileIdentifier: ?string,
  onClose: () => void,
  onRun: () => void,
|};

const CodeModeDialog = ({
  project,
  fileIdentifier,
  onClose,
  onRun,
}: Props): React.Node => {
  const unsavedChanges = React.useContext(UnsavedChangesContext);
  const [revision, setRevision] = React.useState(0);
  const [selectedKey, setSelectedKey] = React.useState<?string>(null);
  const [editorWidth, setEditorWidth] = React.useState(700);
  const editorContainer = React.useRef<?HTMLDivElement>(null);

  // revision нужен, чтобы список пересобирался после добавления скрипта.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scripts = React.useMemo(() => collectScripts(project), [
    project,
    revision,
  ]);
  const selected =
    scripts.find(item => item.key === selectedKey) || scripts[0] || null;

  React.useEffect(
    () => {
      const element = editorContainer.current;
      if (element) setEditorWidth(Math.max(300, element.clientWidth - 4));
    },
    [scripts.length]
  );

  // В Electron нет window.prompt, поэтому имя спрашиваем своим окошком.
  const [nameDialog, setNameDialog] = React.useState<?{|
    mode: 'add' | 'rename',
    isPython: boolean,
    value: string,
  |}>(null);
  const [message, setMessage] = React.useState<?string>(null);

  const addScript = (isPython: boolean, rawName: string) => {
    if (project.getLayoutsCount() === 0) {
      setMessage('В проекте нет сцен. Создай сцену и попробуй снова.');
      return;
    }
    const layout = selected
      ? project.getLayout(selected.layoutName)
      : project.getLayoutAt(0);
    const events = layout.getEvents();
    const event = events.insertNewEvent(
      project,
      JS_CODE_EVENT_TYPE,
      events.getEventsCount()
    );
    const name = rawName.trim();
    const template = isPython
      ? unwrapPythonCode(PYTHON_EVENT_TEMPLATE) || ''
      : '// JavaScript: доступен runtimeScene\n';
    const body = setScriptName(template, name, isPython);
    gd.asJsCodeEvent(event).setInlineCode(
      isPython ? wrapPythonCode(body) : body
    );
    unsavedChanges.triggerUnsavedChanges();
    setRevision(r => r + 1);
    setSelectedKey(null);
  };

  const onChangeCode = (newValue: string) => {
    if (!selected) return;
    const jsEvent = gd.asJsCodeEvent(selected.event);
    jsEvent.setInlineCode(
      selected.isPython ? wrapPythonCode(newValue) : newValue
    );
    unsavedChanges.triggerUnsavedChanges();
  };

  const startRename = () => {
    if (!selected) return;
    const inline = gd.asJsCodeEvent(selected.event).getInlineCode();
    const python = unwrapPythonCode(inline);
    const body = python !== null ? python : inline;
    setNameDialog({
      mode: 'rename',
      isPython: selected.isPython,
      value: getScriptName(body) || '',
    });
  };

  const renameScript = (newName: string) => {
    if (!selected) return;
    const jsEvent = gd.asJsCodeEvent(selected.event);
    const inline = jsEvent.getInlineCode();
    const python = unwrapPythonCode(inline);
    const body = python !== null ? python : inline;
    const newBody = setScriptName(body, newName.trim(), selected.isPython);
    jsEvent.setInlineCode(
      selected.isPython ? wrapPythonCode(newBody) : newBody
    );
    unsavedChanges.triggerUnsavedChanges();
    setRevision(r => r + 1);
  };

  const deleteScript = () => {
    if (!selected) return;
    if (!window.confirm('Удалить этот скрипт?')) return;
    const layout = project.getLayout(selected.layoutName);
    const removed = selected.event;
    // Удаляем событие из того списка, где оно лежит (в сцене или во вложенных).
    const removeFrom = (events: gdEventsList): boolean => {
      for (let i = 0; i < events.getEventsCount(); i++) {
        const event = events.getEventAt(i);
        if (event.ptr === removed.ptr) {
          events.removeEventAt(i);
          return true;
        }
        if (event.canHaveSubEvents() && removeFrom(event.getSubEvents()))
          return true;
      }
      return false;
    };
    removeFrom(layout.getEvents());
    unsavedChanges.triggerUnsavedChanges();
    setSelectedKey(null);
    setRevision(r => r + 1);
  };

  const applyNameDialog = () => {
    if (!nameDialog) return;
    const { mode, isPython, value } = nameDialog;
    setNameDialog(null);
    if (mode === 'add') addScript(isPython, value);
    else renameScript(value.trim());
  };

  const currentCode = selected
    ? (() => {
        const inline = gd.asJsCodeEvent(selected.event).getInlineCode();
        const python = unwrapPythonCode(inline);
        return python !== null ? python : inline;
      })()
    : '';

  return (
    <Dialog
      open
      title="Режим кода"
      maxWidth="lg"
      fullWidth
      onRequestClose={onClose}
      actions={[<FlatButton key="close" label="Закрыть" onClick={onClose} />]}
      secondaryActions={[
        <FlatButton
          key="py"
          label="+ Python"
          onClick={() =>
            setNameDialog({ mode: 'add', isPython: true, value: '' })
          }
        />,
        <FlatButton
          key="js"
          label="+ JavaScript"
          onClick={() =>
            setNameDialog({ mode: 'add', isPython: false, value: '' })
          }
        />,
        <FlatButton
          key="rename"
          label="Переименовать"
          disabled={!selected}
          onClick={startRename}
        />,
        <FlatButton
          key="delete"
          label="Удалить"
          disabled={!selected}
          onClick={deleteScript}
        />,
        <FlatButton
          key="vscode"
          label="Открыть в VS Code"
          disabled={!fileIdentifier}
          onClick={() => {
            if (fileIdentifier) openProjectInVsCode(fileIdentifier);
          }}
        />,
        <RaisedButton key="run" primary label="Запуск" onClick={onRun} />,
      ]}
    >
      {message && (
        <div style={{ padding: '0 0 8px' }}>
          <Text color="error">{message}</Text>
        </div>
      )}
      {nameDialog && (
        <Dialog
          open
          title={
            nameDialog.mode === 'add' ? 'Новый скрипт' : 'Название скрипта'
          }
          maxWidth="xs"
          fullWidth
          onRequestClose={() => setNameDialog(null)}
          actions={[
            <FlatButton
              key="cancel"
              label="Отмена"
              onClick={() => setNameDialog(null)}
            />,
            <RaisedButton
              key="ok"
              primary
              label={nameDialog.mode === 'add' ? 'Создать' : 'Сохранить'}
              onClick={applyNameDialog}
            />,
          ]}
          onApply={applyNameDialog}
        >
          <TextField
            autoFocus="desktop"
            fullWidth
            floatingLabelText="Название (можно оставить пустым)"
            value={nameDialog.value}
            onChange={(e, text) =>
              setNameDialog(current =>
                current ? { ...current, value: text } : current
              )
            }
          />
        </Dialog>
      )}
      <div style={styles.body}>
        <div style={styles.list}>
          {scripts.length === 0 && (
            <div style={styles.empty}>
              <Text>
                В проекте пока нет скриптов. Нажми «+ Python» или «+
                JavaScript».
              </Text>
            </div>
          )}
          {scripts.map(item => (
            <button
              key={item.key}
              type="button"
              style={{
                ...styles.item,
                ...(selected && selected.key === item.key
                  ? styles.itemSelected
                  : {}),
              }}
              onClick={() => setSelectedKey(item.key)}
            >
              <span style={styles.badge}>{item.isPython ? 'PY' : 'JS'}</span>
              <span>{item.name || `${item.layoutName} · ${item.id}`}</span>
            </button>
          ))}
        </div>
        <div style={styles.editor} ref={editorContainer}>
          {selected ? (
            <CodeEditor
              key={selected.key}
              language={selected.isPython ? 'python' : 'javascript'}
              value={currentCode}
              onChange={onChangeCode}
              initialScrollTop={0}
              initialCursorColumn={0}
              initialCursorLine={0}
              saveEditorState={() => {}}
              width={editorWidth}
              height={
                typeof window !== 'undefined'
                  ? Math.max(320, window.innerHeight - 300)
                  : 480
              }
              onFocus={() => {}}
              onBlur={() => {}}
            />
          ) : null}
        </div>
      </div>
    </Dialog>
  );
};

export default CodeModeDialog;
