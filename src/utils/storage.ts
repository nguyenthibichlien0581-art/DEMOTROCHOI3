import { Question, ScoreEntry } from '../types';
import { INITIAL_QUESTIONS } from './questions';

const QUESTIONS_KEY = 'energy_quest_questions';
const LEADERBOARD_KEY = 'energy_quest_leaderboard';

export const storage = {
  getQuestions: (): Question[] => {
    const stored = localStorage.getItem(QUESTIONS_KEY);
    if (!stored) {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(INITIAL_QUESTIONS));
      return INITIAL_QUESTIONS;
    }
    return JSON.parse(stored);
  },
  saveQuestions: (questions: Question[]) => {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  },
  getLeaderboard: (): ScoreEntry[] => {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  saveScore: (entry: ScoreEntry) => {
    const leaderboard = storage.getLeaderboard();
    leaderboard.push(entry);
    // Sort by score descending and take top 10
    const top10 = leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
  },
  clearLeaderboard: () => {
    localStorage.removeItem(LEADERBOARD_KEY);
  }
};
