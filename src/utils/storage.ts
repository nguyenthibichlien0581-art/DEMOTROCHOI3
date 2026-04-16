import { Question, ScoreEntry } from '../types';
import { INITIAL_QUESTIONS } from './questions';

const DB_NAME = 'EnergyQuestDB';
const DB_VERSION = 1;
const QUESTIONS_STORE = 'questions';
const LEADERBOARD_STORE = 'leaderboard';

class StorageDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error opening database');
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
          db.createObjectStore(QUESTIONS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(LEADERBOARD_STORE)) {
          db.createObjectStore(LEADERBOARD_STORE, { autoIncrement: true });
        }
      };
    });
  }

  async getQuestions(): Promise<Question[]> {
    const db = await this.open();
    return new Promise((resolve) => {
      const transaction = db.transaction(QUESTIONS_STORE, 'readonly');
      const store = transaction.objectStore(QUESTIONS_STORE);
      const request = store.getAll();
      request.onsuccess = async () => {
        let questions = request.result;
        
        // Attempt migration from localStorage if empty
        if (!questions || questions.length === 0) {
          const stored = localStorage.getItem('energy_quest_questions');
          if (stored) {
            questions = JSON.parse(stored);
            await this.saveQuestions(questions);
            localStorage.removeItem('energy_quest_questions');
          }
        }

        if (!questions || questions.length === 0) {
          // Fallback to initial if still empty
          await this.saveQuestions(INITIAL_QUESTIONS);
          resolve(INITIAL_QUESTIONS);
        } else {
          // Migration check
          if (questions.length > 0 && !questions[0].optionA) {
            await this.saveQuestions(INITIAL_QUESTIONS);
            resolve(INITIAL_QUESTIONS);
          } else {
            resolve(questions);
          }
        }
      };
    });
  }

  async saveQuestions(questions: Question[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(QUESTIONS_STORE, 'readwrite');
      const store = transaction.objectStore(QUESTIONS_STORE);
      
      store.clear().onsuccess = () => {
        questions.forEach(q => store.add(q));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject();
      };
    });
  }

  async getLeaderboard(): Promise<ScoreEntry[]> {
    const db = await this.open();
    return new Promise((resolve) => {
      const transaction = db.transaction(LEADERBOARD_STORE, 'readonly');
      const store = transaction.objectStore(LEADERBOARD_STORE);
      const request = store.getAll();
      request.onsuccess = async () => {
        let results = request.result || [];

        // Attempt migration from localStorage if empty
        if (results.length === 0) {
          const stored = localStorage.getItem('energy_quest_leaderboard');
          if (stored) {
            results = JSON.parse(stored);
            for (const entry of results) {
              await this.saveScore(entry);
            }
            localStorage.removeItem('energy_quest_leaderboard');
          }
        }

        const sorted = (results || []).sort((a: any, b: any) => b.score - a.score).slice(0, 10);
        resolve(sorted);
      };
    });
  }

  async saveScore(entry: ScoreEntry): Promise<void> {
    const db = await this.open();
    return new Promise((resolve) => {
      const transaction = db.transaction(LEADERBOARD_STORE, 'readwrite');
      const store = transaction.objectStore(LEADERBOARD_STORE);
      store.add(entry);
      transaction.oncomplete = () => resolve();
    });
  }

  async clearLeaderboard(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve) => {
      const transaction = db.transaction(LEADERBOARD_STORE, 'readwrite');
      const store = transaction.objectStore(LEADERBOARD_STORE);
      store.clear().onsuccess = () => resolve();
    });
  }
}

export const storage = new StorageDB();
