'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Sparkles, ArrowRight, Flame, Trophy, Volume2, ShieldCheck, Star, Users, CheckCircle, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-xs sm:text-sm mb-6"
        >
          <Sparkles className="h-4 w-4" />
          <span>A Nova Era do Aprendizado de Inglês</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6"
        >
          Aprenda Inglês de Forma{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-600 bg-clip-text text-transparent">
            Divertida, Fluida e Gamificada
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-foreground/75 max-w-2xl leading-relaxed mb-10"
        >
          Domine o idioma mais importante do mundo através de micro-lições interativas, conquistas exclusivas e um sistema inteligente de fixação de conteúdo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full"
        >
          <button
            onClick={handleStart}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl cursor-pointer hover:bg-primary/95 shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 duration-200"
          >
            <span>{user ? 'Acessar Painel' : 'Começar Agora Grátis'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          {!user && (
            <button
              onClick={() => router.push('/login')}
              className="w-full sm:w-auto px-8 py-4 border border-border bg-card/50 text-foreground font-semibold text-lg rounded-2xl cursor-pointer hover:bg-card transition-all hover:-translate-y-0.5 duration-200"
            >
              Já tenho uma conta
            </button>
          )}
        </motion.div>
      </section>

      {/* Gamification Stats / Visual indicators */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Exercícios Práticos', value: '500+', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-500/10' },
            { label: 'Dias Consecutivos', value: 'Sequências 🔥', icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
            { label: 'Recompensas de XP', value: 'Níveis 1-100', icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10' },
            { label: 'Pronúncia Perfeita', value: 'Web Speech 🔊', icon: Volume2, color: 'text-sky-500 bg-sky-500/10' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border shadow-sm shadow-black/5 text-center hover:border-primary/20 transition-all group"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-xl sm:text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-foreground/60">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Features grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full border-t border-border/40">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Por que estudar no{' '}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
              EnglishFlow?
            </span>
          </h2>
          <p className="text-lg text-foreground/70">
            Combinamos psicologia da aprendizagem com tecnologia de ponta para criar a melhor experiência educacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Prática Multimodal',
              desc: 'Cinco tipos diferentes de exercícios interativos, incluindo múltipla escolha, drag-and-drop de palavras, escuta, tradução e preenchimento de lacunas.',
              icon: GraduationCap,
              gradient: 'from-sky-500 to-cyan-500'
            },
            {
              title: 'Gamificação Profunda',
              desc: 'Ganhe XP por cada resposta correta, suba de nível do 1 ao 100, conquiste insígnias exclusivas e mantenha sua chama do aprendizado com a sequência diária.',
              icon: Flame,
              gradient: 'from-orange-500 to-rose-500'
            },
            {
              title: 'Totalmente Offline',
              desc: 'Baixe suas lições preferidas de forma nativa e estude em qualquer lugar sem conexão de internet. Nosso sistema otimizado gerencia o progresso offline.',
              icon: ShieldCheck,
              gradient: 'from-purple-500 to-indigo-500'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${feature.gradient} shadow-lg shadow-primary/10 mb-6 group-hover:rotate-6 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border/40 text-center text-sm text-foreground/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© 2026 EnglishFlow. Desenvolvido para a excelência acadêmica e profissional.</p>
        </div>
      </footer>
    </div>
  );
}
