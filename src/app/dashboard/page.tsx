'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  Sparkles, Flame, Trophy, Volume2, BookOpen, CheckCircle2, Circle, Play,
  Lock, ArrowRight, TrendingUp, Compass, Award, Goal, Loader2, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('A1');
  const [updatingGoal, setUpdatingGoal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('Error fetching dashboard details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateGoal = async (xp: number) => {
    setUpdatingGoal(true);
    try {
      const res = await fetch('/api/profile/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyGoalXp: xp }),
      });
      if (res.ok) {
        await refreshUser();
        await fetchDashboardData();
      }
    } catch (e) {
      console.error('Error updating goal:', e);
    } finally {
      setUpdatingGoal(false);
    }
  };

  if (loading || !user || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-foreground/60 text-sm">Carregando seus dados de estudo...</p>
      </div>
    );
  }

  // Calculate today's XP (dynamic mock data aligned with user XP in backend)
  const todayXp = data.weeklyData[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].xp || 0;
  const goalPercentage = Math.min(100, Math.round((todayXp / user.dailyGoalXp) * 100));

  const categories = [
    { id: 'A1', title: 'A1 - Básico I', desc: 'Saudações, números, cores e família' },
    { id: 'A2', title: 'A2 - Básico II', desc: 'Rotinas, lugares, alimentação e compras' },
    { id: 'B1', title: 'B1 - Intermediário I', desc: 'Tempos verbais e conversação básica' },
    { id: 'B2', title: 'B2 - Intermediário II', desc: 'Escrita, expressões e interpretação' },
    { id: 'C1', title: 'C1 - Avançado', desc: 'Inglês profissional e tecnologia' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col lg:flex-row gap-8 relative z-10">
      {/* Dynamic backdrop gradients */}
      <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Left Column: Learning pathway & Levels */}
      <div className="flex-1 flex flex-col">
        {/* Daily Goal card */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[30px] pointer-events-none" />
          <div className="flex-1 space-y-2 relative z-10">
            <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
              <Goal className="h-4.5 w-4.5" />
              <span>Meta Diária de Estudos</span>
            </div>
            <h3 className="text-xl font-bold">
              {todayXp} de {user.dailyGoalXp} XP hoje
            </h3>
            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden relative border border-border/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalPercentage}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
              />
            </div>
            <p className="text-xs text-foreground/60">
              {goalPercentage}% concluído. Continue praticando para manter sua sequência!
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0 relative z-10">
            <span className="text-xs font-semibold text-foreground/60">Ajustar Meta:</span>
            <div className="flex gap-1.5">
              {[20, 50, 100].map((xp) => (
                <button
                  key={xp}
                  disabled={updatingGoal}
                  onClick={() => handleUpdateGoal(xp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                    user.dailyGoalXp === xp
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10'
                      : 'bg-secondary/40 border-border/60 hover:bg-secondary text-foreground/80'
                  }`}
                >
                  {xp === 20 ? 'Casual' : xp === 50 ? 'Regular' : 'Foco'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Personalized Lesson CTA Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-primary/10 border border-primary/20 shadow-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-[40px] pointer-events-none group-hover:scale-110 duration-500" />
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-1.5 text-primary font-extrabold text-sm uppercase tracking-wide">
              <BrainCircuit className="h-4.5 w-4.5 animate-pulse" />
              <span>Super Tutor Inteligente</span>
            </div>
            <h3 className="text-lg font-black">Lição Personalizada por IA</h3>
            <p className="text-xs text-foreground/60 max-w-lg leading-relaxed">
              Oliver irá analisar seu progresso, erros e conquistas para gerar uma lição de conversação e gramática 100% exclusiva para seu perfil!
            </p>
          </div>
          <button
            onClick={() => router.push('/lesson/personalized')}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-extrabold text-xs rounded-2xl cursor-pointer hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-97 shrink-0"
          >
            <Sparkles className="h-4 w-4 fill-current animate-float" />
            Gerar Minha Lição IA
          </button>
        </div>

        {/* Level Category Picker */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold shrink-0 cursor-pointer transition-all border ${
                activeCategory === cat.id
                  ? 'bg-primary/15 text-primary border-primary/30 font-extrabold shadow-sm'
                  : 'bg-card border-border hover:border-primary/20 text-foreground/70'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Level description banner */}
        <div className="p-4 rounded-2xl bg-secondary/35 border border-border/40 text-foreground/75 text-sm mb-6 flex items-center gap-3">
          <Compass className="h-5 w-5 text-primary" />
          <span>
            {categories.find((c) => c.id === activeCategory)?.desc}. Pratique exercícios e suba de nível.
          </span>
        </div>

        {/* Lessons pathway grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {data.groupedLessons[activeCategory]?.length > 0 ? (
            data.groupedLessons[activeCategory].map((lesson: any) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl bg-card border transition-all flex flex-col justify-between group ${
                  lesson.completed
                    ? 'border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                    : 'border-border hover:border-primary/30 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        lesson.difficulty === 'EASY'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : lesson.difficulty === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {lesson.difficulty === 'EASY' ? 'Fácil' : lesson.difficulty === 'MEDIUM' ? 'Médio' : 'Difícil'}
                    </span>
                    {lesson.completed ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        Concluído
                      </span>
                    ) : (
                      <span className="text-foreground/50 text-xs font-semibold">
                        {lesson.exerciseCount} exercícios
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h4>
                  <p className="text-sm text-foreground/60 line-clamp-2 leading-relaxed mb-6">
                    {lesson.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedLesson(lesson)}
                    className="flex-1 py-3 border border-border bg-card hover:bg-secondary/40 rounded-2xl text-xs font-semibold cursor-pointer text-foreground/80 hover:text-foreground transition-all text-center flex items-center justify-center gap-1.5 active:scale-97"
                  >
                    <BookOpen className="h-4 w-4" />
                    Ver Teoria
                  </button>
                  <button
                    onClick={() => router.push(`/lesson/${lesson.id}`)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 hover:-translate-y-0.5 duration-200 active:scale-97 ${
                      lesson.completed
                        ? 'bg-emerald-500 hover:bg-emerald-500/90 text-white shadow-emerald-500/10'
                        : 'bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/20'
                    }`}
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {lesson.completed ? 'Praticar Novamente' : 'Iniciar Lição'}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 rounded-3xl border border-dashed border-border/80 text-center flex flex-col items-center justify-center p-6 text-foreground/50">
              <Lock className="h-10 w-10 mb-4 text-foreground/30" />
              <p className="font-semibold mb-1">Nenhuma lição disponível para {activeCategory}</p>
              <p className="text-xs">Nossos administradores adicionarão novas lições em breve!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: User Sidebar (Streaks, Achievements, XP Charts) */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        {/* User Card */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-2xl shadow-lg border border-white/10">
            {user.avatar === 'avatar_admin' ? '🦉' : user.avatar === 'avatar_user' ? '🦁' : '🦊'}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{user.name}</h3>
            <span className="text-xs text-foreground/60">{user.email}</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-md">
                Nível {user.level}
              </span>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                {user.xp} XP acumulado
              </span>
            </div>
          </div>
        </div>

        {/* Streaks & XP Chart */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Progresso Semanal</span>
            <div className="flex items-center gap-1 text-orange-500 font-extrabold text-sm bg-orange-500/10 px-2.5 py-1 rounded-xl">
              <Flame className="h-4 w-4 fill-orange-500" />
              <span>{user.streak} dias</span>
            </div>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--foreground)" opacity={0.4} fontSize={10} tickLine={false} />
                <YAxis stroke="var(--foreground)" opacity={0.4} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--foreground)',
                  }}
                />
                <Area type="monotone" dataKey="xp" stroke="#38bdf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorXp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Achievements Summary */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-1.5 font-bold text-sm">
              <Award className="h-4.5 w-4.5 text-primary" />
              <span>Conquistas</span>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Ver Todas
            </button>
          </div>
          
          <div className="text-center py-2 bg-secondary/20 rounded-2xl border border-border/30">
            <span className="text-2xl font-black text-primary">
              {data.achievements.unlockedCount} / {data.achievements.total}
            </span>
            <p className="text-[10px] text-foreground/50 font-medium">CONQUISTAS DESBLOQUEADAS</p>
          </div>

          <div className="space-y-2.5">
            {data.achievements.unlocked.slice(0, 3).map((ua: any) => (
              <div key={ua.achievement.id} className="flex items-center gap-3 p-2 bg-secondary/15 rounded-xl border border-border/20">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg shadow-sm">
                  {ua.achievement.icon === 'award' ? '🏆' : ua.achievement.icon === 'flame' ? '🔥' : '⭐'}
                </div>
                <div>
                  <h5 className="text-xs font-bold">{ua.achievement.name}</h5>
                  <p className="text-[10px] text-foreground/60 leading-tight">{ua.achievement.description}</p>
                </div>
              </div>
            ))}
            {data.achievements.unlockedCount === 0 && (
              <p className="text-xs text-foreground/50 text-center py-3">Conclua lições para destravar conquistas!</p>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Details / Theory Modal */}
      <AnimatePresence>
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLesson(null)}
              className="fixed inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 overflow-y-auto max-h-[85vh]"
            >
              <button
                onClick={() => setSelectedLesson(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-secondary/40 text-foreground/60 hover:text-foreground cursor-pointer transition-all active:scale-95"
              >
                ✕
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/15 text-primary border border-primary/20">
                  Categoria {selectedLesson.level}
                </span>
                <span className="text-xs text-foreground/50">•</span>
                <span className="text-xs text-foreground/50 font-medium">Teoria Completa</span>
              </div>

              <h3 className="text-2xl font-extrabold mb-4">{selectedLesson.title}</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-foreground/80 mb-2 border-b border-border/30 pb-1.5">
                    Introdução Teórica
                  </h4>
                  <p className="text-sm text-foreground/75 leading-relaxed bg-secondary/15 p-4 rounded-2xl border border-border/30">
                    {selectedLesson.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground/80 mb-3 border-b border-border/30 pb-1.5">
                    Expressões de Exemplo
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hardcoded seed definitions or loaded dynamic JSON */}
                    {selectedLesson.id ? (
                      // Parse if examples exist as array
                      (() => {
                        try {
                          // Standard fallback
                          const examples = typeof selectedLesson.examples === 'string' 
                            ? JSON.parse(selectedLesson.examples) 
                            : selectedLesson.examples;
                          
                          return examples.map((ex: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between">
                              <div>
                                <span className="text-xs font-bold text-primary">EN</span>
                                <p className="font-extrabold text-base mb-1">{ex.english}</p>
                                <span className="text-xs font-bold text-amber-500">PT</span>
                                <p className="font-semibold text-sm mb-2">{ex.portuguese}</p>
                              </div>
                              {ex.hint && (
                                <p className="text-[10px] text-foreground/50 border-t border-border/40 pt-1.5 mt-1.5 italic">
                                  Dica: {ex.hint}
                                </p>
                              )}
                            </div>
                          ));
                        } catch (e) {
                          return <p className="text-xs text-destructive">Falha ao ler exemplos.</p>;
                        }
                      })()
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="flex-1 py-3.5 border border-border bg-card hover:bg-secondary/40 rounded-2xl text-xs font-bold cursor-pointer text-foreground/80 hover:text-foreground transition-all text-center"
                >
                  Fechar Teoria
                </button>
                <button
                  onClick={() => router.push(`/lesson/${selectedLesson.id}`)}
                  className="flex-1 py-3.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10 rounded-2xl text-xs font-bold cursor-pointer transition-all text-center"
                >
                  Estudar Prática
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
