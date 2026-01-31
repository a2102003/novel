import { Book } from '../types';

const DB_NAME = 'ZenReaderDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const db = {
  // Save a new book or update existing one
  saveBook: async (book: Book): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(book);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Get all books
  getAllBooks: async (): Promise<Book[]> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete a book
  deleteBook: async (id: string): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Update reading progress
  updateProgress: async (id: string, chapterIndex: number): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // First get the book
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const book = getRequest.result as Book;
        if (book) {
          book.lastReadChapterIndex = chapterIndex;
          // Calculate progress percentage (simple version)
          book.progress = Math.round(((chapterIndex + 1) / book.chapters.length) * 100);
          store.put(book);
          resolve();
        } else {
          resolve(); // Book not found, ignore
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
};