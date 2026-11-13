import { AppSettings, CornellNote, StandaloneComparison } from '../types/note';

const DB_NAME = 'sankalan_upsc_notebook_db';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_COMPARISONS = 'comparisons';
const STORE_SETTINGS = 'settings';

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'user-settings',
  defaultCuesRatio: 30,
  editorFont: 'serif',
  spellCheck: true,
  printBlackAndWhite: false,
  printIncludeSummary: true,
  printIncludeSources: true,
  customSubjects: [],
  folders: [],
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_COMPARISONS)) {
        db.createObjectStore(STORE_COMPARISONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(`${DB_NAME}:${storeName}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  }
}

async function putInStore<T>(storeName: string, item: T): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = await getAllFromStore<T & { id: string }>(storeName);
    const typedItem = item as T & { id: string };
    const next = existing.filter((e) => e.id !== typedItem.id).concat(typedItem);
    localStorage.setItem(`${DB_NAME}:${storeName}`, JSON.stringify(next));
  }
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = await getAllFromStore<{ id: string }>(storeName);
    const next = existing.filter((e) => e.id !== id);
    localStorage.setItem(`${DB_NAME}:${storeName}`, JSON.stringify(next));
  }
}

async function clearStore(storeName: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorage.removeItem(`${DB_NAME}:${storeName}`);
  }
}

export const storage = {
  async getAllNotes(): Promise<CornellNote[]> {
    const notes = await getAllFromStore<CornellNote>(STORE_NOTES);
    return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async saveNote(note: CornellNote): Promise<void> {
    await putInStore(STORE_NOTES, note);
  },

  async deleteNote(id: string): Promise<void> {
    await deleteFromStore(STORE_NOTES, id);
  },

  async getAllComparisons(): Promise<StandaloneComparison[]> {
    const list = await getAllFromStore<StandaloneComparison>(STORE_COMPARISONS);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async saveComparison(cmp: StandaloneComparison): Promise<void> {
    await putInStore(STORE_COMPARISONS, cmp);
  },

  async deleteComparison(id: string): Promise<void> {
    await deleteFromStore(STORE_COMPARISONS, id);
  },

  async getSettings(): Promise<AppSettings> {
    const list = await getAllFromStore<AppSettings>(STORE_SETTINGS);
    const found = list.find((s) => s.id === 'user-settings');
    return found ? { ...DEFAULT_SETTINGS, ...found } : DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await putInStore(STORE_SETTINGS, settings);
  },

  async exportBackup(): Promise<string> {
    const [notes, comparisons, settings] = await Promise.all([
      this.getAllNotes(),
      this.getAllComparisons(),
      this.getSettings(),
    ]);
    return JSON.stringify(
      {
        app: 'Sankalan UPSC Cornell Notebook',
        version: 1,
        exportedAt: new Date().toISOString(),
        notes,
        comparisons,
        settings,
      },
      null,
      2
    );
  },

  async importBackup(jsonText: string, mode: 'merge' | 'replace'): Promise<{ notesCount: number; comparisonsCount: number }> {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.notes)) {
      throw new Error('Invalid backup file format: missing notes array.');
    }
    const incomingNotes: CornellNote[] = parsed.notes;
    const incomingComparisons: StandaloneComparison[] = Array.isArray(parsed.comparisons) ? parsed.comparisons : [];
    const incomingSettings: AppSettings | null = parsed.settings ?? null;

    if (mode === 'replace') {
      await clearStore(STORE_NOTES);
      await clearStore(STORE_COMPARISONS);
    }

    for (const note of incomingNotes) {
      if (note && note.id && typeof note.title === 'string') {
        await this.saveNote(note);
      }
    }
    for (const cmp of incomingComparisons) {
      if (cmp && cmp.id && cmp.table) {
        await this.saveComparison(cmp);
      }
    }
    if (incomingSettings && mode === 'replace') {
      await this.saveSettings({ ...DEFAULT_SETTINGS, ...incomingSettings, id: 'user-settings' });
    } else if (incomingSettings && mode === 'merge') {
      const current = await this.getSettings();
      const mergedSubjects = Array.from(new Set([...current.customSubjects, ...(incomingSettings.customSubjects ?? [])]));
      const existingFolderIds = new Set(current.folders.map((f) => f.id));
      const mergedFolders = [
        ...current.folders,
        ...(incomingSettings.folders ?? []).filter((f) => !existingFolderIds.has(f.id)),
      ];
      await this.saveSettings({ ...current, customSubjects: mergedSubjects, folders: mergedFolders });
    }

    return {
      notesCount: incomingNotes.length,
      comparisonsCount: incomingComparisons.length,
    };
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      clearStore(STORE_NOTES),
      clearStore(STORE_COMPARISONS),
      clearStore(STORE_SETTINGS),
    ]);
  },
};
