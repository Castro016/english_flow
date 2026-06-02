'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useAudio } from '@/hooks/useAudio';
import { useSpeech } from '@/hooks/useSpeech';
import {
  Heart, X, CheckCircle, AlertTriangle, Play, Sparkles, Volume2, Award, Flame,
  Loader2, Trophy, ArrowRight, RotateCcw, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function LessonPlayroomPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;
  const { user, refreshUser } = useAuth();
  const { playSuccess, playError } = useAudio();
  const { speak } = useSpeech();

  // Core playroom states
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [lives, setLives] = useState(5);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [draggedWords, setDraggedWords] = useState<string[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  // Load lesson details
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`/api/lesson/${lessonId}`);
        if (res.ok) {
          const d = await res.json();
          setLesson(d.lesson);
        } else {
          router.push('/dashboard');
        }
      } catch (e) {
        console.error('Error loading lesson details:', e);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (lessonId) fetchLesson();
  }, [lessonId, router]);

  if (loading || !lesson) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-foreground/60 text-sm">Carregando a sala de exercícios...</p>
      </div>
    );
  }

  const currentExercise = lesson.exercises[currentStep];
  const totalExercises = lesson.exercises.length;
  const progressPercentage = Math.round((currentStep / totalExercises) * 100);

  // Validate answer logic
  const handleCheckAnswer = () => {
    if (isAnswerChecked) return;

    let answerSubmitted = '';
    let isAnswerRight = false;

    if (currentExercise.type === 'CHOICE') {
      answerSubmitted = selectedOption || '';
      isAnswerRight = answerSubmitted === currentExercise.answer;
    } else if (currentExercise.type === 'DRAG') {
      answerSubmitted = draggedWords.join(' ');
      // Standardize spacing and casing
      isAnswerRight =
        answerSubmitted.trim().toLowerCase() === currentExercise.answer.trim().toLowerCase();
    } else if (
      currentExercise.type === 'BLANK' ||
      currentExercise.type === 'TRANSLATE' ||
      currentExercise.type === 'LISTEN'
    ) {
      answerSubmitted = typedAnswer.trim();
      isAnswerRight =
        answerSubmitted.toLowerCase() === currentExercise.answer.trim().toLowerCase();
    }

    setIsCorrect(isAnswerRight);
    setIsAnswerChecked(true);

    if (isAnswerRight) {
      playSuccess();
    } else {
      playError();
      setLives((prev) => Math.max(0, prev - 1));
    }
  };

  // Move to the next exercise or finalize the lesson
  const handleContinue = async () => {
    // Reset individual step states
    setSelectedOption(null);
    setTypedAnswer('');
    setDraggedWords([]);
    setIsAnswerChecked(false);

    if (lives <= 0) {
      // Game over, return home or retry
      router.push('/dashboard');
      return;
    }

    if (currentStep + 1 >= totalExercises) {
      // Complete lesson
      setSavingProgress(true);
      try {
        const baseXP = lesson.difficulty === 'EASY' ? 10 : lesson.difficulty === 'MEDIUM' ? 20 : 30;
        const res = await fetch(`/api/lesson/${lessonId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xpEarned: baseXP }),
        });
        if (res.ok) {
          const result = await res.json();
          setCompletionResult(result);
          setIsLessonFinished(true);
          
          // Trigger confetti celebration!
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
          
          await refreshUser();
        }
      } catch (e) {
        console.error('Error saving completion:', e);
      } finally {
        setSavingProgress(false);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Drag and drop helpers
  const handleWordClick = (word: string) => {
    if (isAnswerChecked) return;
    if (draggedWords.includes(word)) {
      setDraggedWords((prev) => prev.filter((w) => w !== word));
    } else {
      setDraggedWords((prev) => [...prev, word]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground relative select-none">
      {/* Dynamic background accents */}
      <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Screen layout switches between Exercise panel and final Scorecard */}
      {!isLessonFinished ? (
        <>
          {/* Header Progress Panel */}
          <header className="w-full max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-6 relative z-10">
            {/* Close button */}
            <button
              onClick={() => {
                if (confirm('Deseja realmente sair da lição? Seu progresso atual será perdido.')) {
                  router.push('/dashboard');
                }
              }}
              className="p-2.5 rounded-xl border border-border hover:bg-secondary/40 cursor-pointer transition-all hover:text-destructive active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Linear Progress Bar */}
            <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden border border-border/40 relative">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Lives Heart counter */}
            <div className="flex items-center gap-1.5 font-bold text-rose-500 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm">
              <Heart className="h-5 w-5 fill-rose-500 animate-pulse" />
              <span>{lives}</span>
            </div>
          </header>

          {/* Core Exercise Workspace */}
          <main className="flex-1 max-w-2xl mx-auto px-4 py-8 flex flex-col justify-center w-full relative z-10">
            {lives <= 0 ? (
              // GAME OVER STATE
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 rounded-3xl glass border border-destructive/20 shadow-xl max-w-md mx-auto space-y-6"
              >
                <div className="h-16 w-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mx-auto animate-float">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-destructive">Suas vidas acabaram!</h2>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  Não desanime! Errar faz parte do aprendizado. Volte para o painel e estude a teoria antes de tentar novamente.
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 py-3 px-4 border border-border rounded-xl text-sm font-semibold cursor-pointer hover:bg-secondary/40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Home className="h-4 w-4" />
                    Voltar Início
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Tentar de Novo
                  </button>
                </div>
              </motion.div>
            ) : (
              // ACTIVE EXERCISE LAYOUT
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Category Header */}
                  <div className="text-center md:text-left">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Exercício {currentStep + 1} de {totalExercises}
                    </span>
                    <h3 className="text-2xl font-black mt-2 leading-snug">
                      {currentExercise.question}
                    </h3>
                  </div>

                  {/* 1. Multiple Choice (CHOICE) */}
                  {currentExercise.type === 'CHOICE' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {currentExercise.options.map((opt: string, i: number) => {
                        const isSelected = selectedOption === opt;
                        return (
                          <button
                            key={i}
                            disabled={isAnswerChecked}
                            onClick={() => setSelectedOption(opt)}
                            className={`p-4 sm:p-5 rounded-2xl text-left font-bold text-xs sm:text-sm md:text-base border cursor-pointer transition-all active:scale-98 flex items-center ${
                              isSelected
                                ? 'bg-primary/15 border-primary text-primary shadow-md'
                                : 'bg-card border-border hover:border-primary/40 text-foreground/80'
                            }`}
                          >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground/60 text-xs font-black mr-3 uppercase shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. Word Drag Organizer (DRAG) */}
                  {currentExercise.type === 'DRAG' && (
                    <div className="space-y-6 pt-4">
                      {/* Workspace shelf */}
                      <div className="min-h-16 p-4 rounded-2xl bg-secondary/30 border border-border/80 flex flex-wrap gap-2.5 items-center">
                        {draggedWords.length === 0 ? (
                          <span className="text-sm text-foreground/45 italic pl-2">
                            Toque nas palavras abaixo para organizar a resposta...
                          </span>
                        ) : (
                          draggedWords.map((word, i) => (
                            <button
                              key={i}
                              disabled={isAnswerChecked}
                              onClick={() => handleWordClick(word)}
                              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl cursor-pointer hover:bg-primary/95 transition-all shadow-sm flex items-center gap-1"
                            >
                              <span>{word}</span>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Option pool */}
                      <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                        {currentExercise.options.map((word: string, i: number) => {
                          const isUsed = draggedWords.includes(word);
                          return (
                            <button
                              key={i}
                              disabled={isUsed || isAnswerChecked}
                              onClick={() => handleWordClick(word)}
                              className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                                isUsed
                                  ? 'opacity-25 bg-secondary border-transparent cursor-not-allowed scale-95'
                                  : 'bg-card border-border hover:border-primary/45 hover:scale-105 active:scale-95'
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Fill in the Blank (BLANK) */}
                  {currentExercise.type === 'BLANK' && (
                    <div className="pt-6 max-w-md mx-auto">
                      <input
                        type="text"
                        disabled={isAnswerChecked}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Escreva a palavra que falta..."
                        className="w-full px-6 py-4 rounded-2xl bg-secondary/50 border border-border/60 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-center font-extrabold text-lg"
                      />
                    </div>
                  )}

                  {/* 4. Translation PT -> EN (TRANSLATE) */}
                  {currentExercise.type === 'TRANSLATE' && (
                    <div className="pt-6 space-y-4">
                      <textarea
                        rows={3}
                        disabled={isAnswerChecked}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Digite a tradução em português/inglês..."
                        className="w-full p-5 rounded-2xl bg-secondary/50 border border-border/60 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all font-semibold text-base leading-relaxed"
                      />
                    </div>
                  )}

                  {/* 5. Listening practice (LISTEN) */}
                  {currentExercise.type === 'LISTEN' && (
                    <div className="pt-4 flex flex-col items-center gap-6">
                      <button
                        onClick={() => speak(currentExercise.answer)}
                        className="h-20 w-20 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 hover:scale-105 cursor-pointer transition-transform active:scale-95 animate-pulse"
                        title="Ouvir áudio"
                      >
                        <Volume2 className="h-8 w-8" />
                      </button>
                      <span className="text-xs text-foreground/50 font-bold tracking-wide">
                        CLIQUE NO BOTÃO PARA OUVIR A SENTENÇA
                      </span>
                      
                      <input
                        type="text"
                        disabled={isAnswerChecked}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Digite exatamente o que ouviu..."
                        className="w-full max-w-md px-6 py-4 rounded-2xl bg-secondary/50 border border-border/60 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-center font-bold text-base mt-2"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          {/* Drawer / Footer Controls */}
          {lives > 0 && (
            <footer
              className={`w-full py-6 border-t transition-all duration-300 relative z-20 ${
                isAnswerChecked
                  ? isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-card border-border/40'
              }`}
            >
              <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {isAnswerChecked ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-start gap-3"
                      >
                        {isCorrect ? (
                          <>
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm sm:text-base leading-tight">Excelente trabalho!</h4>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Sua resposta está 100% correta!</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm sm:text-base leading-tight">Resposta incorreta</h4>
                              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                                Resposta correta:{' '}
                                <span className="font-bold underline">{currentExercise.answer}</span>
                              </p>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <p className="text-xs text-foreground/50 pl-2">
                        {currentExercise.type === 'CHOICE' && 'Selecione uma das opções acima.'}
                        {currentExercise.type === 'DRAG' && 'Organize as palavras acima.'}
                        {(currentExercise.type === 'BLANK' ||
                          currentExercise.type === 'TRANSLATE' ||
                          currentExercise.type === 'LISTEN') &&
                          'Preencha o campo de digitação acima.'}
                      </p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isAnswerChecked ? (
                    <button
                      onClick={handleContinue}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white cursor-pointer shadow-lg transition-all hover:-translate-y-0.5 duration-200 active:scale-97 ${
                        isCorrect
                          ? 'bg-emerald-500 hover:bg-emerald-500/95 shadow-emerald-500/20'
                          : 'bg-rose-500 hover:bg-rose-500/95 shadow-rose-500/20'
                      }`}
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      disabled={
                        (currentExercise.type === 'CHOICE' && !selectedOption) ||
                        (currentExercise.type === 'DRAG' && draggedWords.length === 0) ||
                        ((currentExercise.type === 'BLANK' ||
                          currentExercise.type === 'TRANSLATE' ||
                          currentExercise.type === 'LISTEN') &&
                          !typedAnswer.trim())
                      }
                      onClick={handleCheckAnswer}
                      className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground font-extrabold text-sm rounded-2xl cursor-pointer hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 duration-200 active:scale-97"
                    >
                      Verificar Resposta
                    </button>
                  )}
                </div>
              </div>
            </footer>
          )}
        </>
      ) : (
        // LESSON COMPLETION SCORECARD SCREEN
        <div className="flex-1 max-w-md mx-auto px-4 py-16 flex flex-col justify-center items-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-8 sm:p-10 rounded-3xl glass border border-border shadow-2xl text-center space-y-8"
          >
            {/* Celebration icon */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-sky-500/20 animate-float">
                🎓
              </div>
            </div>

            {/* Scorecard Header */}
            <div>
              <div className="flex items-center gap-1.5 justify-center text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Lição Concluída</span>
              </div>
              <h2 className="text-3xl font-black">Excelente Trabalho!</h2>
              <p className="text-sm text-foreground/60 mt-1 leading-relaxed">
                Você concluiu a lição de {lesson.title} com sucesso!
              </p>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
                <div className="text-2xl font-black text-sky-500">
                  +{completionResult.xpEarned} XP
                </div>
                <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">
                  XP CONQUISTADO
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
                <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 fill-orange-500" />
                  <span>{completionResult.newStreak}d</span>
                </div>
                <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">
                  SEQUÊNCIA ATUAL
                </span>
              </div>
            </div>

            {/* Level up alerts */}
            {completionResult.didLevelUp && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-sm flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 fill-amber-500/20 animate-bounce" />
                <span>Parabéns! Você subiu para o Nível {completionResult.newLevel}!</span>
              </div>
            )}

            {/* Unlocked Achievements list */}
            {completionResult.unlockedAchievements?.length > 0 && (
              <div className="space-y-3 text-left">
                <span className="text-xs font-bold text-foreground/60 uppercase tracking-widest block text-center border-b border-border/30 pb-2">
                  Novas Conquistas Desbloqueadas!
                </span>
                {completionResult.unlockedAchievements.map((ach: any) => (
                  <div
                    key={ach.id}
                    className="flex items-center gap-3 p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-xl shadow-sm font-bold">
                      {ach.icon === 'award' ? '🏆' : ach.icon === 'flame' ? '🔥' : '⭐'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-primary leading-snug">
                        {ach.name}
                      </h4>
                      <p className="text-[10px] text-foreground/70 leading-normal">
                        {ach.description}
                      </p>
                      <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                        +{ach.xpReward} XP BONUS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-2xl cursor-pointer hover:bg-primary/95 shadow-xl shadow-primary/25 transition-all hover:-translate-y-0.5 duration-200 active:scale-97"
            >
              <span>Finalizar Lição</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
