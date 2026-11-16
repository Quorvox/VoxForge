// @flow
// VoxForge: проекты лежат прямо в браузере на компьютере человека (IndexedDB).
// На сервер ничего не отправляется — он только раздаёт сам редактор.

const DATABASE_NAME = 'voxforge-projects';
const STORE_NAME = 'projects';
const HANDLES_STORE_NAME = 'handles';
const DATABASE_VERSION = 2;

export type StoredProject = {|
  id: string,
  name: string,
  /** Проект целиком в виде JSON-строки. */
  content: string,
  lastModifiedDate: number,
|};

export type StoredProjectInfo = {|
  id: string,
  name: string,
  lastModifiedDate: number,
|};

let databasePromise: ?Promise<IDBDatabase> = null;

const openDatabase = (): Promise<IDBDatabase> => {
  if (databasePromise) return databasePromise;
  const promise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Браузер не поддерживает локальное хранилище.'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      // Доступ к папкам на компьютере (проекты-папки): FileSystemDirectoryHandle.
      if (!database.objectStoreNames.contains(HANDLES_STORE_NAME)) {
        database.createObjectStore(HANDLES_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Не удалось открыть хранилище.'));
  });
  // Если открыть не вышло, в следующий раз пробуем заново.
  promise.catch(() => {
    databasePromise = null;
  });
  databasePromise = promise;
  return promise;
};

const runRequest = async <T>(
  mode: 'readonly' | 'readwrite',
  makeRequest: IDBObjectStore => IDBRequest,
  storeName: string = STORE_NAME
): Promise<T> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = makeRequest(transaction.objectStore(storeName));
    transaction.oncomplete = () => resolve((request.result: any));
    transaction.onerror = () =>
      reject(transaction.error || new Error('Ошибка локального хранилища.'));
    transaction.onabort = () =>
      reject(transaction.error || new Error('Запись отменена браузером.'));
  });
};

export const generateProjectId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

export const saveStoredProject = (project: StoredProject): Promise<void> =>
  runRequest('readwrite', store => store.put(project)).then(() => undefined);

export const loadStoredProject = async (id: string): Promise<?StoredProject> => {
  const result = await runRequest('readonly', store => store.get(id));
  return result || null;
};

export const deleteStoredProject = (id: string): Promise<void> =>
  runRequest('readwrite', store => store.delete(id)).then(() => undefined);

/** Список проектов без самого содержимого, свежие первыми. */
export const listStoredProjects = async (): Promise<Array<StoredProjectInfo>> => {
  const all: Array<StoredProject> = await runRequest('readonly', store =>
    store.getAll()
  );
  return all
    .map(({ id, name, lastModifiedDate }) => ({ id, name, lastModifiedDate }))
    .sort((a, b) => b.lastModifiedDate - a.lastModifiedDate);
};

/** Запоминаем доступ к выбранной папке, чтобы открыть проект из списка. */
export const saveDirectoryHandle = (id: string, handle: any): Promise<void> =>
  runRequest(
    'readwrite',
    store => store.put({ id, handle }),
    HANDLES_STORE_NAME
  ).then(() => undefined);

export const loadDirectoryHandle = async (id: string): Promise<any> => {
  const result: ?{ id: string, handle: any } = await runRequest(
    'readonly',
    store => store.get(id),
    HANDLES_STORE_NAME
  );
  return result ? result.handle : null;
};
