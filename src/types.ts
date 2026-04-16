export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MediaOption {
  text: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface Question {
  id: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  optionA: MediaOption;
  optionB: MediaOption;
  correctOption: 'A' | 'B';
  explanation: string;
  difficulty: Difficulty;
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
