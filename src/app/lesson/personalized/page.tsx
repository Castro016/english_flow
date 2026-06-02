'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useAudio } from '@/hooks/useAudio';
import { useSpeech } from '@/hooks/useSpeech';
import {
  Heart, X, CheckCircle, AlertTriangle, Sparkles, Volume2, Flame,
  Loader2, Trophy, ArrowRight, RotateCcw, Home, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Exercise {
  type: 'CHOICE' | 'DRAG' | 'BLANK' | 'TRANSLATE' | 'LISTEN';
  question: string;
  answer: string;
  options: string[];
}

interface Lesson {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  level: string;
  introduction: string;
  examples: { english: string; portuguese: string; hint?: string }[];
  exercises: Exercise[];
}

export default function AIPersonalyzedPlayroomPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { playSuccess, playError } = useAudio();
  const { speak } = useSpeech();

  // Custom AI states
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Active playroom stats
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

  // Speech helper prioritized for premium neural voices
  const speakWithPremiumVoice = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Prioritize natural sounding/premium neural voices on the browser
    const premiumVoice = 
      voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('google')) ||
      voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('natural')) ||
      voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('neural')) ||
      voices.find(v => v.lang.startsWith('en-')) ||
      voices[0];

    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Dynamically load custom AI generated lesson
  const fetchPersonalizedLesson = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/personalized-lesson');
      if (res.ok) {
        const d = await res.json();
        setLesson(d.lesson);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Não foi possível gerar sua lição. Tente reiniciar.');
      }
    } catch (e) {
      console.error('Error generating AI lesson:', e);
      setErrorMsg('Ocorreu um erro interno de conexão com o motor de IA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPersonalizedLesson();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground px-4 text-center">
        <BrainCircuit className="h-14 w-14 text-primary animate-pulse mb-4" />
        <h3 className="text-xl font-bold mb-2">Oliver está analisando seu perfil...</h3>
        <p className="text-foreground/60 text-sm max-w-sm leading-relaxed">
          Estamos compilando seus erros, acertos e progresso para desenhar uma lição personalizada exclusiva para você usando a IA Qwen-122B!
        </p>
        <Loader2 className="h-6 w-6 text-primary animate-spin mt-6" />
      </div>
    );
  }

  if (errorMsg || !lesson) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground px-4 text-center space-y-6">
        <div className="h-14 w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">Ops! Falha na Geração</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-normal">
            {errorMsg || 'Não foi possível estabelecer contato com a inteligência artificial.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 border border-border rounded-xl text-xs font-semibold hover:bg-secondary/40 cursor-pointer"
          >
            Voltar ao Início
          </button>
          <button
            onClick={fetchPersonalizedLesson}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs cursor-pointer hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
          >
            Tentar Novamente
          </button>
        </div>
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
      isAnswerRight = answerSubmitted.trim().toLowerCase() === currentExercise.answer.trim().toLowerCase();
    } else if (
      currentExercise.type === 'BLANK' ||
      currentExercise.type === 'TRANSLATE' ||
      currentExercise.type === 'LISTEN'
    ) {
      answerSubmitted = typedAnswer.trim();
      isAnswerRight = answerSubmitted.toLowerCase() === currentExercise.answer.trim().toLowerCase();
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

  // Move to next step or complete lesson
  const handleContinue = async () => {
    setSelectedOption(null);
    setTypedAnswer('');
    setDraggedWords([]);
    setIsAnswerChecked(false);

    if (lives <= 0) {
      router.push('/dashboard');
      return;
    }

    if (currentStep + 1 >= totalExercises) {
      setSavingProgress(true);
      try {
        const res = await fetch('/api/ai/personalized-lesson/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xpEarned: 40 }), // Dynamic +40 XP reward
        });
        if (res.ok) {
          const result = await res.json();
          setCompletionResult(result);
          setIsLessonFinished(true);

          confetti({
            particleCount: 180,
            spread: 90,
            origin: { y: 0.6 }
          });

          await refreshUser();
        }
      } catch (e) {
        console.error('Error saving dynamic progress:', e);
      } finally {
        setSavingProgress(false);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

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
      <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {!isLessonFinished ? (
        <>
          {/* Progress Header */}
          <header className="w-full max-w-4xl mx-auto px-4 py-6 flex items-center justify-between gap-6 relative z-10">
            <button
              onClick={() => {
                if (confirm('Deseja sair da sua lição personalizada gerada por IA?')) {
                  router.push('/dashboard');
                }
              }}
              className="p-2.5 rounded-xl border border-border hover:bg-secondary/40 cursor-pointer transition-all active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden border border-border/40 relative">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex items-center gap-1.5 font-bold text-rose-500 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm">
              <Heart className="h-5 w-5 fill-rose-500" />
              <span>{lives}</span>
            </div>
          </header>

          {/* Core Exercise Workspace */}
          <main className="flex-1 max-w-2xl mx-auto px-4 py-8 flex flex-col justify-center w-full relative z-10">
            {lives <= 0 ? (
              /* GAME OVER */
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
                  Erros geram aprendizado. Vamos recarregar a lição personalizada para recalibrar seu progresso.
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 py-3 px-4 border border-border rounded-xl text-sm font-semibold cursor-pointer hover:bg-secondary/40"
                  >
                    Voltar Início
                  </button>
                  <button
                    onClick={fetchPersonalizedLesson}
                    className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-sm cursor-pointer hover:bg-primary/95 shadow-md"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ACTIVE EXERCISE STEP */
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left">
                    <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                      <Sparkles className="h-4 w-4 fill-primary/10" />
                      <span>Lição Personalizada por IA • {currentStep + 1} de {totalExercises}</span>
                    </span>
                    <h3 className="text-2xl font-black mt-2 leading-snug">
                      {currentExercise.question}
                    </h3>
                  </div>

                  {/* CHOICE */}
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
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground/60 text-xs font-black mr-3 uppercase">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* DRAG */}
                  {currentExercise.type === 'DRAG' && (
                    <div className="space-y-6 pt-4">
                      <div className="min-h-16 p-4 rounded-2xl bg-secondary/30 border border-border/80 flex flex-wrap gap-2.5 items-center">
                        {draggedWords.length === 0 ? (
                          <span className="text-sm text-foreground/45 italic pl-2">
                            Toque nas palavras para ordenar...
                          </span>
                        ) : (
                          draggedWords.map((word, i) => (
                            <button
                              key={i}
                              disabled={isAnswerChecked}
                              onClick={() => handleWordClick(word)}
                              className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl cursor-pointer hover:bg-primary/95 transition-all shadow-sm"
                            >
                              <span>{word}</span>
                            </button>
                          ))
                        )}
                      </div>

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
                                  ? 'opacity-25 bg-secondary border-transparent scale-95'
                                  : 'bg-card border-border hover:border-primary/45'
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* BLANK */}
                  {currentExercise.type === 'BLANK' && (
                    <div className="pt-6 max-w-md mx-auto">
                      <input
                        type="text"
                        disabled={isAnswerChecked}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Escreva a resposta..."
                        className="w-full px-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:outline-none transition-all text-center font-extrabold text-lg"
                      />
                    </div>
                  )}

                  {/* TRANSLATE */}
                  {currentExercise.type === 'TRANSLATE' && (
                    <div className="pt-6">
                      <textarea
                        rows={3}
                        disabled={isAnswerChecked}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Digite a tradução correta..."
                        className="w-full p-5 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:outline-none transition-all font-semibold text-base"
                      />
                    </div>
                  )}

                  {/* LISTEN */}
                  {currentExercise.type === 'LISTEN' && (
                    <div className="pt-4 flex flex-col items-center gap-6">
                      <button
                        onClick={() => speakWithPremiumVoice(currentExercise.answer)}
                        className="h-20 w-20 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 hover:scale-105 cursor-pointer transition-transform animate-pulse"
                      >
                        <Volume2 className="h-8 w-8" />
                      </button>
                      <span className="text-xs text-foreground/50 font-bold tracking-wide">
                        TOQUE NO BOTÃO PARA OUVIR (VOZ NEURAL PREMIUM)
                      </span>
                      
                      <input
                        type="text"
                        disabled={isAnswerChecked}
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        placeholder="Digite o que ouviu..."
                        className="w-full max-w-md px-6 py-4 rounded-2xl bg-secondary/50 border focus:border-primary focus:outline-none transition-all text-center font-bold text-base"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          {/* Footer Controls */}
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
                              <h4 className="font-extrabold text-sm sm:text-base leading-tight">Perfeito!</h4>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Frase construída corretamente.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm sm:text-base leading-tight">Houve um engano</h4>
                              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                                Correto:{' '}
                                <span className="font-bold underline">{currentExercise.answer}</span>
                              </p>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      <p className="text-xs text-foreground/50 pl-2">
                        {currentExercise.type === 'CHOICE' && 'Selecione uma das opções acima.'}
                        {currentExercise.type === 'DRAG' && 'Ordene as palavras.'}
                        {['BLANK', 'TRANSLATE', 'LISTEN'].includes(currentExercise.type) && 'Escreva sua resposta no campo acima.'}
                      </p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isAnswerChecked ? (
                    <button
                      onClick={handleContinue}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white cursor-pointer shadow-lg transition-all active:scale-97 ${
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
                        (['BLANK', 'TRANSLATE', 'LISTEN'].includes(currentExercise.type) && !typedAnswer.trim())
                      }
                      onClick={handleCheckAnswer}
                      className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground font-extrabold text-sm rounded-2xl cursor-pointer hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 duration-200 active:scale-97"
                    >
                      Verificar
                    </button>
                  )}
                </div>
              </div>
            </footer>
          )}
        </>
      ) : (
        /* SCORECARD */
        <div className="flex-1 max-w-md mx-auto px-4 py-16 flex flex-col justify-center items-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-8 rounded-3xl glass border border-border shadow-2xl text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-sky-500/20 animate-float">
                🤖
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 justify-center text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Lição IA Concluída</span>
              </div>
              <h2 className="text-3xl font-black">Meta Atingida!</h2>
              <p className="text-sm text-foreground/60 mt-1 leading-relaxed">
                Você concluiu a lição personalizada de {lesson.title} com êxito!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30 text-center">
                <div className="text-2xl font-black text-sky-500">
                  +{completionResult.xpEarned} XP
                </div>
                <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider block mt-1">
                  XP DIPLOMA IA
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30 text-center">
                <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 fill-orange-500" />
                  <span>{completionResult.newStreak}d</span>
                </div>
                <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider block mt-1">
                  SEQUÊNCIA DIÁRIA
                </span>
              </div>
            </div>

            {completionResult.didLevelUp && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 font-bold text-sm flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 fill-amber-500/20 animate-bounce" />
                <span>Parabéns! Subiu para o Nível {completionResult.newLevel}!</span>
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-extrabold text-sm rounded-2xl cursor-pointer hover:bg-primary/95 shadow-xl transition-all"
            >
              <span>Voltar ao Painel</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
