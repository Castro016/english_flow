'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  Sparkles, Flame, Trophy, Award, Calendar, BookOpen, Clock, Loader2,
  CheckCircle, ArrowLeft, History, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (e) {
        console.error('Error fetching profile detail:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  if (loading || !user || !data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-24">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-foreground/60 text-sm">Carregando perfil e conquistas...</p>
      </div>
    );
  }

  const registerDate = new Date(user.createdAt).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8 relative z-10">
      {/* Background accents */}
      <div className="absolute top-[10%] left-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

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

      {/* Profile Header card */}
      <div className="p-8 rounded-3xl bg-card border border-border shadow-md flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
        
        {/* Large Mascot Avatar */}
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-xl shadow-sky-500/15 border border-white/10 relative">
          <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center border-2 border-card text-white text-xs font-black shadow-md">
            {user.level}
          </div>
          {user.avatar === 'avatar_admin' ? '🦉' : user.avatar === 'avatar_user' ? '🦁' : '🦊'}
        </div>

        {/* User identification */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-3xl font-black">{user.name}</h2>
          <p className="text-sm text-foreground/60">{user.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Membro desde: {registerDate}
            </span>
            {user.role === 'ADMIN' && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Administrador
              </span>
            )}
          </div>
        </div>

        {/* Global summary stats */}
        <div className="grid grid-cols-3 gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/50 pt-6 md:pt-0 md:pl-8">
          <div className="text-center">
            <span className="text-2xl font-black text-sky-500 block">{user.xp}</span>
            <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">XP Total</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-orange-500 block flex items-center justify-center gap-0.5">
              <Flame className="h-5 w-5 fill-orange-500 shrink-0" />
              {user.streak}
            </span>
            <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">Sequência</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-emerald-500 block">
              {data.progressHistory.filter((p: any) => p.completed).length}
            </span>
            <span className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider">Lições</span>
          </div>
        </div>
      </div>

      {/* Achievement Cabinet Grid */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <Award className="h-5.5 w-5.5 text-primary animate-float" />
          <h3 className="text-xl font-bold">Gabinete de Conquistas</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {data.achievements.map((ach: any) => (
            <div
              key={ach.id}
              className={`p-6 rounded-3xl bg-card border transition-all flex items-start gap-4 ${
                ach.unlocked
                  ? 'border-primary/20 shadow-md shadow-primary/5 hover:border-primary/40'
                  : 'border-border opacity-50 saturate-50 hover:opacity-75 transition-opacity'
              }`}
            >
              {/* Achievement Badge */}
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border ${
                  ach.unlocked
                    ? 'bg-gradient-to-tr from-sky-400 to-indigo-500 border-white/10 text-white'
                    : 'bg-secondary border-border/60 text-foreground/40'
                }`}
              >
                {ach.icon === 'award' ? '🏆' : ach.icon === 'flame' ? '🔥' : ach.icon === 'zap' ? '⚡' : ach.icon === 'book-open' ? '📖' : ach.icon === 'calendar' ? '📅' : '⭐'}
              </div>

              {/* Achievement specs */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-sm leading-snug">{ach.name}</h4>
                  {ach.unlocked && (
                    <span className="h-4 px-1.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold flex items-center shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/60 leading-relaxed">{ach.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                    +{ach.xpReward} XP
                  </span>
                  {ach.unlocked && ach.unlockedAt && (
                    <span className="text-[9px] text-foreground/45">
                      Destravada em {new Date(ach.unlockedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico de Estudos (Study logs) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <History className="h-5.5 w-5.5 text-primary" />
          <h3 className="text-xl font-bold">Histórico de Atividades</h3>
        </div>

        <div className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden">
          {data.progressHistory.length > 0 ? (
            <div className="divide-y divide-border/40">
              {data.progressHistory.map((historyItem: any) => (
                <div
                  key={historyItem.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/15 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                        {historyItem.lesson.title}
                      </h4>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        Categoria {historyItem.lesson.level} • {historyItem.lesson.difficulty === 'EASY' ? 'Fácil' : historyItem.lesson.difficulty === 'MEDIUM' ? 'Médio' : 'Difícil'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-sm font-bold text-sky-500 block">
                        +{historyItem.score} XP
                      </span>
                      <span className="text-[10px] text-foreground/45">
                        Concluída em {new Date(historyItem.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/lesson/${historyItem.lesson.id}`)}
                      className="p-2 rounded-xl bg-secondary/40 border border-border/40 hover:bg-secondary text-foreground/70 hover:text-foreground cursor-pointer transition-all hover:translate-x-0.5 active:scale-95"
                      title="Estudar novamente"
                    >
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-foreground/50">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-foreground/35 animate-float" />
              <p className="font-semibold text-sm mb-1">Nenhuma lição no histórico</p>
              <p className="text-xs">Comece a estudar e veja suas conquistas aparecerem aqui!</p>
            </div>
          )}
        </div>
      </section>

      {/* LGPD Privacy Cabinet - NEW! */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-3">
          <History className="h-5.5 w-5.5 text-primary shrink-0" />
          <h3 className="text-xl font-bold">Privacidade &amp; LGPD</h3>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[30px] pointer-events-none" />
          <div className="space-y-1.5 relative z-10">
            <h4 className="font-extrabold text-base flex items-center gap-2">
              <span>🛡️ Seus Direitos de Privacidade (Art. 18 LGPD)</span>
            </h4>
            <p className="text-xs text-foreground/60 leading-relaxed max-w-2xl">
              Você possui total controle sobre as suas informações corporativas. Exporte o relatório completo de seus dados ou exclua permanentemente o seu registro de nossos servidores a qualquer momento.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0 relative z-10 w-full md:w-auto">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/profile/export');
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `englishflow_data_export_${user.id.slice(0, 8)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } else {
                    alert('Falha ao exportar dados.');
                  }
                } catch (e) {
                  alert('Erro de conexão ao exportar dados.');
                }
              }}
              className="flex-1 md:flex-none px-4 py-2.5 bg-secondary text-secondary-foreground font-semibold text-xs rounded-xl border border-border/60 hover:bg-secondary/80 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              📥 Exportar Meus Dados
            </button>
            <button
              onClick={async () => {
                if (
                  confirm(
                    'ATENÇÃO: Deseja realmente excluir permanentemente a sua conta?\n\nEsta ação é irreversível e apagará permanentemente todos os seus dados de cadastro, XP acumulado, progresso de lições e conquistas em total conformidade com a LGPD (Direito ao Esquecimento).'
                  )
                ) {
                  try {
                    const res = await fetch('/api/profile/delete', { method: 'POST' });
                    if (res.ok) {
                      alert('Sua conta e todos os dados associados foram excluídos com sucesso.');
                      window.location.href = '/';
                    } else {
                      alert('Falha ao excluir a conta.');
                    }
                  } catch (e) {
                    alert('Erro de conexão.');
                  }
                }
              }}
              className="flex-1 md:flex-none px-4 py-2.5 bg-destructive text-destructive-foreground font-semibold text-xs rounded-xl hover:bg-destructive/95 cursor-pointer shadow-md shadow-destructive/10 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              🗑️ Excluir Conta Permanentemente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
