'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  Sparkles, ShieldAlert, BookOpen, PlusCircle, Trash, Edit, Settings, Users,
  CheckCircle, ArrowLeft, Loader2, Save, FileText, Sparkle, CircleDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<'lessons' | 'exercises' | 'users'>('lessons');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [lessons, setLessons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);

  // Form states - Lesson
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonDifficulty, setLessonDifficulty] = useState('EASY');
  const [lessonLevel, setLessonLevel] = useState('A1');
  const [lessonIntro, setLessonIntro] = useState('');
  const [lessonExamples, setLessonExamples] = useState<any[]>([
    { english: '', portuguese: '', hint: '' }
  ]);

  // Form states - Exercise
  const [exFormOpen, setExFormOpen] = useState(false);
  const [exType, setExType] = useState('CHOICE');
  const [exQuestion, setExQuestion] = useState('');
  const [exAnswer, setExAnswer] = useState('');
  const [exOptionPool, setExOptionPool] = useState('');

  // Form states - User Adjustments
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('USER');
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userStreak, setUserStreak] = useState(0);

  // Fetch functions
  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/admin/lessons');
      if (res.ok) {
        const d = await res.json();
        setLessons(d.lessons);
      }
    } catch (e) {
      console.error('Error fetching admin lessons:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users);
      }
    } catch (e) {
      console.error('Error fetching admin users:', e);
    }
  };

  const fetchExercises = async (lessonId: string) => {
    try {
      const res = await fetch(`/api/admin/exercises?lessonId=${lessonId}`);
      if (res.ok) {
        const d = await res.json();
        setExercises(d.exercises);
      }
    } catch (e) {
      console.error('Error fetching exercises:', e);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchLessons();
      await fetchUsers();
      setLoading(false);
    };
    if (user?.role === 'ADMIN') initData();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-foreground/60 text-sm">Carregando painel administrativo...</p>
      </div>
    );
  }

  // --- LESSON CRUD handlers ---
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanExamples = lessonExamples.filter((ex) => ex.english.trim() !== '');
    const payload = {
      title: lessonTitle,
      description: lessonDesc,
      difficulty: lessonDifficulty,
      level: lessonLevel,
      introduction: lessonIntro,
      examples: cleanExamples,
    };

    try {
      let res;
      if (editingLessonId) {
        res = await fetch(`/api/admin/lessons/${editingLessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setLessonFormOpen(false);
        setEditingLessonId(null);
        // Reset forms
        setLessonTitle('');
        setLessonDesc('');
        setLessonIntro('');
        setLessonExamples([{ english: '', portuguese: '', hint: '' }]);
        await fetchLessons();
      }
    } catch (e) {
      console.error('Error saving lesson:', e);
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description);
    setLessonDifficulty(lesson.difficulty);
    setLessonLevel(lesson.level);
    setLessonIntro(lesson.introduction);
    try {
      setLessonExamples(JSON.parse(lesson.examples));
    } catch (e) {
      setLessonExamples([{ english: '', portuguese: '', hint: '' }]);
    }
    setLessonFormOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Deseja realmente excluir esta lição e todos os seus exercícios associados?')) return;
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchLessons();
        if (activeLesson?.id === lessonId) setActiveLesson(null);
      }
    } catch (e) {
      console.error('Error deleting lesson:', e);
    }
  };

  const addExampleRow = () => {
    setLessonExamples([...lessonExamples, { english: '', portuguese: '', hint: '' }]);
  };

  // --- EXERCISE CRUD handlers ---
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson) return;

    // Split options pool by comma or new line
    const parsedOptions = exOptionPool
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt !== '');

    const payload = {
      lessonId: activeLesson.id,
      type: exType,
      question: exQuestion,
      answer: exAnswer,
      options: parsedOptions,
    };

    try {
      const res = await fetch('/api/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setExFormOpen(false);
        setExQuestion('');
        setExAnswer('');
        setExOptionPool('');
        await fetchExercises(activeLesson.id);
        await fetchLessons(); // Update counts
      }
    } catch (e) {
      console.error('Error saving exercise:', e);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Excluir este exercício?')) return;
    try {
      const res = await fetch(`/api/admin/exercises/${exerciseId}`, {
        method: 'DELETE',
      });
      if (res.ok && activeLesson) {
        await fetchExercises(activeLesson.id);
        await fetchLessons();
      }
    } catch (e) {
      console.error('Error deleting exercise:', e);
    }
  };

  // --- USER CRUD handlers ---
  const handleSaveUserStats = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: userRole,
          xp: userXP,
          level: userLevel,
          streak: userStreak,
        }),
      });

      if (res.ok) {
        setEditingUserId(null);
        await fetchUsers();
      }
    } catch (e) {
      console.error('Error saving user stats:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-6 relative z-10">
      {/* Back button */}
      <div className="flex items-center">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground/75 hover:text-foreground cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Painel</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Área Administrativa</h2>
            <p className="text-xs text-foreground/60 mt-0.5">Gerenciador geral do EnglishFlow</p>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border/40 gap-4 mb-2">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'lessons' ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'
          }`}
        >
          Gerenciar Lições
        </button>
        <button
          onClick={() => {
            setActiveTab('exercises');
            if (lessons.length > 0 && !activeLesson) {
              setActiveLesson(lessons[0]);
              fetchExercises(lessons[0].id);
            }
          }}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'exercises' ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'
          }`}
        >
          Gerenciar Exercícios
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-foreground/60 hover:text-foreground'
          }`}
        >
          Gerenciar Usuários
        </button>
      </div>

      {/* TABS CONTAINER */}
      <div className="flex-1">
        {/* TAB 1: LESSONS MANAGEMENT */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Listagem de Lições</h3>
              <button
                onClick={() => {
                  setEditingLessonId(null);
                  setLessonTitle('');
                  setLessonDesc('');
                  setLessonIntro('');
                  setLessonExamples([{ english: '', portuguese: '', hint: '' }]);
                  setLessonFormOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl cursor-pointer hover:bg-primary/95 transition-all shadow-md active:scale-97"
              >
                <PlusCircle className="h-4 w-4" />
                Criar Nova Lição
              </button>
            </div>

            {/* List */}
            <div className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="divide-y divide-border/40">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                          {lesson.level}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary text-foreground/60 font-semibold text-[10px]">
                          {lesson.difficulty}
                        </span>
                        <span className="text-[10px] text-foreground/50">
                          {lesson._count?.exercises || 0} exercícios
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base">{lesson.title}</h4>
                      <p className="text-xs text-foreground/60 mt-1 max-w-2xl leading-relaxed">{lesson.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveLesson(lesson);
                          fetchExercises(lesson.id);
                          setActiveTab('exercises');
                        }}
                        className="px-3.5 py-2 border border-border bg-card hover:bg-secondary/40 rounded-xl text-xs font-semibold cursor-pointer text-foreground/80 hover:text-foreground transition-all flex items-center gap-1"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Exercícios
                      </button>
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="p-2 border border-border rounded-xl text-primary hover:bg-primary/10 cursor-pointer transition-all"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-2 border border-border rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer transition-all"
                        title="Excluir"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {lessons.length === 0 && (
                  <p className="text-sm text-foreground/50 text-center py-10">Nenhuma lição criada ainda.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXERCISES MANAGEMENT */}
        {activeTab === 'exercises' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold shrink-0">Selecionar Lição:</span>
                <select
                  value={activeLesson?.id || ''}
                  onChange={(e) => {
                    const selected = lessons.find((l) => l.id === e.target.value);
                    setActiveLesson(selected);
                    if (selected) fetchExercises(selected.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-card border border-border text-sm font-bold focus:outline-none"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.level} - {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {activeLesson && (
                <button
                  onClick={() => setExFormOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl cursor-pointer hover:bg-primary/95 transition-all shadow-md active:scale-97"
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Exercício
                </button>
              )}
            </div>

            {/* Exercises List */}
            {activeLesson ? (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-foreground/60">
                  Exercícios cadastrados para: <span className="text-foreground">{activeLesson.title}</span>
                </h3>

                <div className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden divide-y divide-border/40">
                  {exercises.map((ex, i) => (
                    <div key={ex.id} className="p-5 flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="h-5 px-2 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-bold flex items-center">
                            {ex.type}
                          </span>
                          <span className="text-xs text-foreground/50">Questão {i + 1}</span>
                        </div>
                        <h4 className="font-bold text-base">{ex.question}</h4>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                          Resposta correta: <span className="font-bold underline text-emerald-500">{ex.answer}</span>
                        </p>
                        {ex.options?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {ex.options.map((opt: string, idx: number) => (
                              <span key={idx} className="text-[10px] font-semibold text-foreground/60 px-2 py-0.5 bg-secondary rounded-lg">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteExercise(ex.id)}
                        className="p-2 border border-border rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer transition-all shrink-0"
                        title="Excluir"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {exercises.length === 0 && (
                    <p className="text-sm text-foreground/50 text-center py-10">Esta lição ainda não possui nenhum exercício.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/50 text-center py-10">Crie uma lição primeiro antes de gerenciar exercícios.</p>
            )}
          </div>
        )}

        {/* TAB 3: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Listagem de Usuários</h3>

            <div className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="divide-y divide-border/40">
                {users.map((usr) => {
                  const isEditing = editingUserId === usr.id;
                  return (
                    <div key={usr.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-lg text-white font-bold shrink-0">
                          {usr.avatar === 'avatar_admin' ? '🦉' : usr.avatar === 'avatar_user' ? '🦁' : '🦊'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-base">{usr.name}</h4>
                          <span className="text-xs text-foreground/50">{usr.email}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-md">
                              Nível {isEditing ? userLevel : usr.level}
                            </span>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {isEditing ? userXP : usr.xp} XP
                            </span>
                            <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                              {isEditing ? userStreak : usr.streak}d streak
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Editing state vs view state */}
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-3 bg-secondary/25 p-4 rounded-2xl border border-border/40 w-full md:w-auto">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-foreground/50">Cargo</span>
                            <select
                              value={userRole}
                              onChange={(e) => setUserRole(e.target.value)}
                              className="px-2 py-1 rounded bg-card border border-border text-xs focus:outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1 w-16">
                            <span className="text-[10px] font-bold text-foreground/50">XP</span>
                            <input
                              type="number"
                              value={userXP}
                              onChange={(e) => setUserXP(Number(e.target.value))}
                              className="px-2 py-1 rounded bg-card border border-border text-xs focus:outline-none w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1 w-12">
                            <span className="text-[10px] font-bold text-foreground/50">Nível</span>
                            <input
                              type="number"
                              value={userLevel}
                              onChange={(e) => setUserLevel(Number(e.target.value))}
                              className="px-2 py-1 rounded bg-card border border-border text-xs focus:outline-none w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1 w-12">
                            <span className="text-[10px] font-bold text-foreground/50">Streak</span>
                            <input
                              type="number"
                              value={userStreak}
                              onChange={(e) => setUserStreak(Number(e.target.value))}
                              className="px-2 py-1 rounded bg-card border border-border text-xs focus:outline-none w-full"
                            />
                          </div>

                          <div className="flex gap-1.5 pt-4 md:pt-0 shrink-0">
                            <button
                              onClick={() => handleSaveUserStats(usr.id)}
                              className="p-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/95 transition-all shadow-sm"
                              title="Salvar"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-2 border border-border rounded-lg cursor-pointer hover:bg-secondary/40 text-foreground/70"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            usr.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' : 'bg-secondary border-border/50 text-foreground/60'
                          }`}>
                            {usr.role}
                          </span>
                          <button
                            onClick={() => {
                              setEditingUserId(usr.id);
                              setUserRole(usr.role);
                              setUserXP(usr.xp);
                              setUserLevel(usr.level);
                              setUserStreak(usr.streak);
                            }}
                            className="p-2 border border-border rounded-xl text-primary hover:bg-primary/10 cursor-pointer transition-all"
                            title="Ajustar Stats"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LESSON MODAL (CREATE / EDIT) */}
      <AnimatePresence>
        {lessonFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLessonFormOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setLessonFormOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-secondary/40 text-foreground/60 hover:text-foreground cursor-pointer transition-all active:scale-95"
              >
                ✕
              </button>

              <h3 className="text-xl font-extrabold mb-6 flex items-center gap-1.5">
                <BookOpen className="h-5.5 w-5.5 text-primary animate-float" />
                <span>{editingLessonId ? 'Editar Lição' : 'Criar Nova Lição'}</span>
              </h3>

              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Título</label>
                    <input
                      type="text"
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="Ex: Saudações"
                      className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Level</label>
                      <select
                        value={lessonLevel}
                        onChange={(e) => setLessonLevel(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm"
                      >
                        <option value="A1">A1 - Básico I</option>
                        <option value="A2">A2 - Básico II</option>
                        <option value="B1">B1 - Intermediário I</option>
                        <option value="B2">B2 - Intermediário II</option>
                        <option value="C1">C1 - Avançado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Dificuldade</label>
                      <select
                        value={lessonDifficulty}
                        onChange={(e) => setLessonDifficulty(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm"
                      >
                        <option value="EASY">EASY (10 XP)</option>
                        <option value="MEDIUM">MEDIUM (20 XP)</option>
                        <option value="HARD">HARD (30 XP)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Breve Descrição</label>
                  <input
                    type="text"
                    required
                    value={lessonDesc}
                    onChange={(e) => setLessonDesc(e.target.value)}
                    placeholder="Descrição curta que aparece no card..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Teoria / Introdução (Markdown)</label>
                  <textarea
                    rows={4}
                    required
                    value={lessonIntro}
                    onChange={(e) => setLessonIntro(e.target.value)}
                    placeholder="Explicação didática das regras gramaticais e estruturas teóricas..."
                    className="w-full p-4 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm leading-relaxed"
                  />
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-t border-border/30 pt-3">
                    <label className="block text-xs font-bold text-primary uppercase">Exemplos de Fixação</label>
                    <button
                      type="button"
                      onClick={addExampleRow}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      + Add Exemplo
                    </button>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {lessonExamples.map((ex, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-secondary/15 p-2 rounded-xl border border-border/35">
                        <input
                          type="text"
                          placeholder="Inglês (e.g. Hello)"
                          value={ex.english}
                          onChange={(e) => {
                            const newExs = [...lessonExamples];
                            newExs[idx].english = e.target.value;
                            setLessonExamples(newExs);
                          }}
                          className="px-2.5 py-1.5 rounded bg-card border border-border text-xs focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Português (e.g. Olá)"
                          value={ex.portuguese}
                          onChange={(e) => {
                            const newExs = [...lessonExamples];
                            newExs[idx].portuguese = e.target.value;
                            setLessonExamples(newExs);
                          }}
                          className="px-2.5 py-1.5 rounded bg-card border border-border text-xs focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Dica (e.g. Saudação)"
                          value={ex.hint}
                          onChange={(e) => {
                            const newExs = [...lessonExamples];
                            newExs[idx].hint = e.target.value;
                            setLessonExamples(newExs);
                          }}
                          className="px-2.5 py-1.5 rounded bg-card border border-border text-xs focus:outline-none animate-fade-in"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => setLessonFormOpen(false)}
                    className="flex-1 py-3 border border-border bg-card hover:bg-secondary/40 rounded-2xl text-xs font-bold cursor-pointer text-foreground/80 hover:text-foreground transition-all text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10 rounded-2xl text-xs font-bold cursor-pointer transition-all text-center"
                  >
                    Salvar Lição
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXERCISE MODAL (CREATE) */}
      <AnimatePresence>
        {exFormOpen && activeLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExFormOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setExFormOpen(false)}
                className="absolute top-4 right-4 h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-secondary/40 text-foreground/60 hover:text-foreground cursor-pointer transition-all active:scale-95"
              >
                ✕
              </button>

              <h3 className="text-xl font-extrabold mb-6 flex items-center gap-1.5">
                <CircleDot className="h-5.5 w-5.5 text-primary" />
                <span>Adicionar Exercício</span>
              </h3>
              <p className="text-xs text-foreground/60 mb-4 font-semibold uppercase">
                Para a lição: <span className="text-foreground">{activeLesson.title}</span>
              </p>

              <form onSubmit={handleSaveExercise} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Tipo de Exercício</label>
                    <select
                      value={exType}
                      onChange={(e) => setExType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm font-bold"
                    >
                      <option value="CHOICE">Múltipla Escolha (CHOICE)</option>
                      <option value="DRAG">Arrastar Palavras (DRAG)</option>
                      <option value="BLANK">Completar Frase (BLANK)</option>
                      <option value="TRANSLATE">Tradução (TRANSLATE)</option>
                      <option value="LISTEN">Escuta / Pronúncia (LISTEN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Enunciado / Pergunta</label>
                    <input
                      type="text"
                      required
                      value={exQuestion}
                      onChange={(e) => setExQuestion(e.target.value)}
                      placeholder="Ex: Como se diz 'Cachorro'?"
                      className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">Resposta Correta</label>
                  <input
                    type="text"
                    required
                    value={exAnswer}
                    onChange={(e) => setExAnswer(e.target.value)}
                    placeholder="Digite a resposta correta exatamente (ou ordem para DRAG)"
                    className="w-full px-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm font-bold text-emerald-500"
                  />
                </div>

                {/* Options pool input for choice and drag */}
                {(exType === 'CHOICE' || exType === 'DRAG') && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 uppercase mb-1">
                      Pool de Opções (Separadas por vírgula)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={exOptionPool}
                      onChange={(e) => setExOptionPool(e.target.value)}
                      placeholder="Ex: Dog, Cat, Bird, Lion (deve conter a resposta correta também!)"
                      className="w-full p-4 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm font-semibold"
                    />
                    <p className="text-[10px] text-foreground/50 mt-1 italic">
                      Dica: Para CHOICE, insira as 4 alternativas. Para DRAG, insira as palavras que o usuário irá reorganizar.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => setExFormOpen(false)}
                    className="flex-1 py-3 border border-border bg-card hover:bg-secondary/40 rounded-2xl text-xs font-bold cursor-pointer text-foreground/80 hover:text-foreground transition-all text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10 rounded-2xl text-xs font-bold cursor-pointer transition-all text-center"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
