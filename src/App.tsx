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
  const [hasInteracted, setHasInteracted] = useState(false);
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
    const loadData = async () => {
      const qs = await storage.getQuestions();
      const lb = await storage.getLeaderboard();
      setQuestions(qs);
      setLeaderboard(lb);
    };
    loadData();
  }, [screen]);

  const handleStart = (name: string, className: string) => {
    setGameState(prev => ({ ...prev, studentName: name, studentClass: className }));
    setScreen('Game');
  };

  const handleFinishGame = async (score: number, answers: { questionId: string; isCorrect: boolean }[]) => {
    const entry: ScoreEntry = {
      name: gameState.studentName,
      className: gameState.studentClass,
      score,
      date: new Date().toISOString()
    };
    await storage.saveScore(entry);
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
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full flex justify-center"
        >
          {screen === 'Start' && (
            <StartScreen 
              onStart={handleStart} 
              onAdmin={() => setScreen('Admin')} 
              hasInteracted={hasInteracted}
              onEnableAudio={() => setHasInteracted(true)}
            />
          )}
          {screen === 'Game' && (
            <GameScreen 
              questions={questions} 
              studentName={gameState.studentName}
              studentClass={gameState.studentClass}
              onFinish={handleFinishGame}
              isAudioEnabled={hasInteracted}
              leaderboard={leaderboard}
            />
          )}
          {screen === 'Result' && (
            <ResultScreen 
              score={gameState.score} 
              total={questions.length * 10}
              onRestart={handleRestart}
              onShowLeaderboard={() => setScreen('Leaderboard')}
              isAudioEnabled={hasInteracted}
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
      <div className="fixed bottom-4 left-4 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] pointer-events-none">
        Nghiêng đầu lượm kiến thức v1.0 • Science Quiz
      </div>
    </div>
  );
}
