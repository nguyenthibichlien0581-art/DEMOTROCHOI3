export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  content: string;
  isCorrect: boolean;
  explanation: string;
  difficulty: Difficulty;
  imageUrl?: string;
  audioUrl?: string;
}

export interface ScoreEntry {
  name: string;
  className: string;
  score: number;
  date: string;
}

export interface GameState {
  studentName: string;
  studentClass: string;
  team: string;
  difficulty: Difficulty;
  currentQuestionIndex: number;
  score: number;
  isGameOver: boolean;
  answers: { questionId: string; isCorrect: boolean }[];
}
