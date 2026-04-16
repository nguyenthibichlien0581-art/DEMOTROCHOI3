import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Difficulty, Question, ScoreEntry } from './types';
import { storage } from './utils/storage';
import StartScreen from './components/StartScreen';
import ModeSelection from './components/ModeSelection';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import { Settings } from 'lucide-react';

type Screen = 'Start' | 'Mode' | 'Game' | 'Result' | 'Leaderboard' | 'Admin';

export default function App() {
  const [screen, setScreen] = useState<Screen>('Start');
  const [gameState, setGameState] = useState<GameState>({
    studentName: '',
    studentClass: '',
    team: '',
    difficulty: 'Easy',
    currentQuestionIndex: 0,
    score: 0,
    isGameOver: false,
    answers: []
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    setQuestions(storage.getQuestions());
    setLeaderboard(storage.getLeaderboard());
  }, [screen]);

  const handleStart = (name: string, className: string) => {
    setGameState(prev => ({ ...prev, studentName: name, studentClass: className, difficulty: 'Easy' }));
    setScreen('Game');
  };

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setGameState(prev => ({ ...prev, difficulty }));
    setScreen('Game');
  };

  const handleFinishGame = (score: number, answers: { questionId: string; isCorrect: boolean }[]) => {
    const entry: ScoreEntry = {
      name: gameState.studentName,
      className: gameState.studentClass,
      score,
      date: new Date().toISOString()
    };
    storage.saveScore(entry);
    setGameState(prev => ({ ...prev, score, answers, isGameOver: true }));
    setScreen('Result');
  };

  const handleRestart = () => {
    setGameState({
      studentName: '',
      studentClass: '',
      difficulty: 'Easy',
      currentQuestionIndex: 0,
      score: 0,
      isGameOver: false,
      answers: []
    });
    setScreen('Start');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-300 to-blue-400 flex flex-col items-center justify-center p-4 font-sans">
      {/* Admin Button */}
      {screen === 'Start' && (
        <button 
          onClick={() => setScreen('Admin')}
          className="fixed top-4 right-4 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-sm"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full flex justify-center"
        >
          {screen === 'Start' && <StartScreen onStart={handleStart} />}
          {screen === 'Mode' && <ModeSelection onSelect={handleSelectDifficulty} />}
          {screen === 'Game' && (
            <GameScreen 
              questions={questions} 
              difficulty={gameState.difficulty} 
              onFinish={handleFinishGame} 
            />
          )}
          {screen === 'Result' && (
            <ResultScreen 
              score={gameState.score} 
              total={questions.filter(q => q.difficulty === gameState.difficulty).length * 10}
              onRestart={handleRestart}
              onShowLeaderboard={() => setScreen('Leaderboard')}
            />
          )}
          {screen === 'Leaderboard' && (
            <Leaderboard 
              entries={leaderboard} 
              onBack={() => setScreen(gameState.isGameOver ? 'Result' : 'Start')} 
            />
          )}
          {screen === 'Admin' && <AdminPanel onClose={() => setScreen('Start')} />}
        </motion.div>
      </AnimatePresence>

      {/* Footer Decoration */}
      <div className="fixed bottom-4 left-4 text-white/40 text-xs font-bold uppercase tracking-widest pointer-events-none">
        Energy Quest v1.0 • 6th Grade Science
      </div>
    </div>
  );
}
