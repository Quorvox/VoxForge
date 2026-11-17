// @flow
// VoxForge: редактор кода для Код-игры. Свой слой над Monaco: у каждого файла
// своя модель (своя история отмены и позиция курсора), подсветка и подсказки
// microScript, проверка `end`, горячие клавиши Ctrl+S, F5, Ctrl+P.
import * as React from 'react';
import {
  LANGUAGE_ID,
  THEME_ID,
  lintMicroScript,
  registerMicroScript,
} from './MicroScript';

export type EditorFile = {| name: string, text: string |};

type Props = {|
  files: Array<EditorFile>,
  active: ?string,
  fontSize: number,
  wordWrap: boolean,
  minimap: boolean,
  /** Перейти к строке: меняй `nonce`, чтобы перейти снова. */
  reveal: ?{| name: string, line: number, nonce: number |},
  onChange: (name: string, text: string) => void,
  onSave: () => void,
  onRun: () => void,
  onQuickOpen: () => void,
  onCursor: (line: number, column: number) => void,
  onProblems: (count: number) => void,
|};

const MicroScriptEditor = (props: Props): React.Node => {
  const [Monaco, setMonaco] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState(false);
  const editorRef = React.useRef<any>(null);
  const monacoRef = React.useRef<any>(null);
  const models = React.useRef<{ [name: string]: any }>({});
  const viewStates = React.useRef<{ [name: string]: any }>({});
  const lintTimers = React.useRef<{ [name: string]: any }>({});
  const [ready, setReady] = React.useState(false);

  // Свежие обработчики, чтобы не пересоздавать редактор.
  const latest = React.useRef(props);
  latest.current = props;

  React.useEffect(() => {
    window.MonacoEnvironment = {
      getWorkerUrl: () => 'external/monaco-editor-min/vs/base/worker/workerMain.js',
    };
    let cancelled = false;
    import(/* webpackChunkName: "react-monaco-editor" */ 'react-monaco-editor')
      .then(module => {
        if (!cancelled) setMonaco(() => module.default);
      })
      .catch(() => setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const lint = (name: string, model: any) => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    const problems = lintMicroScript(model.getValue());
    monaco.editor.setModelMarkers(
      model,
      'voxforge',
      problems.map(problem => ({
        severity: monaco.MarkerSeverity.Warning,
        message: problem.message,
        startLineNumber: problem.line,
        endLineNumber: problem.line,
        startColumn: 1,
        endColumn: model.getLineMaxColumn(problem.line),
      }))
    );
    if (latest.current.active === name) latest.current.onProblems(problems.length);
  };

  const getModel = (file: EditorFile) => {
    const monaco = monacoRef.current;
    let model = models.current[file.name];
    if (!model) {
      model = monaco.editor.createModel(file.text, LANGUAGE_ID);
      models.current[file.name] = model;
      model.onDidChangeContent(() => {
        latest.current.onChange(file.name, model.getValue());
        clearTimeout(lintTimers.current[file.name]);
        lintTimers.current[file.name] = setTimeout(() => lint(file.name, model), 400);
      });
      lint(file.name, model);
    }
    return model;
  };

  const onMount = (editor: any, monaco: any) => {
    monacoRef.current = monaco;
    editorRef.current = editor;
    registerMicroScript(monaco);
    monaco.editor.setTheme(THEME_ID);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () =>
      latest.current.onSave()
    );
    editor.addCommand(monaco.KeyCode.F5, () => latest.current.onRun());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_P, () =>
      latest.current.onQuickOpen()
    );
    editor.onDidChangeCursorPosition(event =>
      latest.current.onCursor(event.position.lineNumber, event.position.column)
    );
    setReady(true);
  };

  // Показываем модель активного файла.
  React.useEffect(
    () => {
      const editor = editorRef.current;
      if (!ready || !editor) return;
      const current = editor.getModel();
      if (current) {
        const name = Object.keys(models.current).find(
          key => models.current[key] === current
        );
        if (name) viewStates.current[name] = editor.saveViewState();
      }
      const file = props.files.find(item => item.name === props.active);
      if (!file) {
        editor.setModel(null);
        props.onProblems(0);
        return;
      }
      const model = getModel(file);
      editor.setModel(model);
      if (viewStates.current[file.name]) {
        editor.restoreViewState(viewStates.current[file.name]);
      }
      editor.focus();
      lint(file.name, model);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, props.active]
  );

  // Удалённые и переименованные файлы: убираем их модели.
  const namesKey = props.files.map(file => file.name).join('\n');
  React.useEffect(
    () => {
      const alive = new Set(props.files.map(file => file.name));
      Object.keys(models.current).forEach(name => {
        if (!alive.has(name)) {
          models.current[name].dispose();
          delete models.current[name];
          delete viewStates.current[name];
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namesKey]
  );

  React.useEffect(
    () => () => {
      Object.keys(lintTimers.current).forEach(name =>
        clearTimeout(lintTimers.current[name])
      );
      Object.keys(models.current).forEach(name => models.current[name].dispose());
      models.current = {};
    },
    []
  );

  React.useEffect(
    () => {
      const editor = editorRef.current;
      const target = props.reveal;
      if (!editor || !target || target.name !== props.active) return;
      editor.revealLineInCenter(target.line);
      editor.setPosition({ lineNumber: target.line, column: 1 });
      editor.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.reveal && props.reveal.nonce, ready]
  );

  // react-monaco-editor сам сбрасывает текст в `value` при каждой перерисовке
  // (от этого пропадал набранный код). Тексты ведём сами через модели, поэтому
  // обёртку рисуем один раз, а настройки меняем через updateOptions.
  const StableMonaco = React.useMemo(
    () => (Monaco ? React.memo(Monaco, () => true) : null),
    [Monaco]
  );

  React.useEffect(
    () => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.updateOptions({
        fontSize: props.fontSize,
        wordWrap: props.wordWrap ? 'on' : 'off',
        minimap: { enabled: props.minimap },
      });
    },
    [ready, props.fontSize, props.wordWrap, props.minimap]
  );

  if (loadError) {
    return (
      <div style={{ padding: 24, color: '#ff8a7a' }}>
        Не удалось загрузить редактор кода. Перезапусти приложение.
      </div>
    );
  }
  if (!StableMonaco) {
    return <div style={{ padding: 24, color: '#9b8f84' }}>Загружаю редактор…</div>;
  }

  return (
    <StableMonaco
      width="100%"
      height="100%"
      language={LANGUAGE_ID}
      theme="vs-dark"
      value=""
      editorDidMount={onMount}
      options={{
        fontSize: props.fontSize,
        fontFamily:
          "'JetBrains Mono', 'Cascadia Code', Consolas, 'Lucida Console', monospace",
        automaticLayout: true,
        minimap: { enabled: props.minimap },
        wordWrap: props.wordWrap ? 'on' : 'off',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: true,
        tabSize: 2,
        insertSpaces: true,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'all',
        folding: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        fixedOverflowWidgets: true,
        renderIndentGuides: true,
      }}
    />
  );
};

export default MicroScriptEditor;
