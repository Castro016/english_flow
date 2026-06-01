'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AVATARS = [
  { id: 'avatar_1', emoji: '🦊', label: 'Raposa' },
  { id: 'avatar_2', emoji: '🐼', label: 'Panda' },
  { id: 'avatar_3', emoji: '🦁', label: 'Leão' },
  { id: 'avatar_4', emoji: '🐨', label: 'Coala' },
  { id: 'avatar_5', emoji: '🦉', label: 'Coruja' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setError(null);
    setLoading(true);

    const err = await register(name, email, password, selectedAvatar);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl glass shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg text-white mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Crie sua conta grátis!</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Junte-se a milhares de estudantes e comece sua jornada.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
              Seu Nome
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-foreground/45">
                <UserIcon className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Silva"
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-foreground/45">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
              Senha (min. 6 caracteres)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-foreground/45">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-secondary/50 border border-border/40 focus:border-primary/80 focus:bg-secondary focus:outline-none transition-all text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">
              Escolha seu Mascote
            </label>
            <div className="flex justify-between gap-2 py-1">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all border ${
                    selectedAvatar === av.id
                      ? 'bg-primary/20 border-primary scale-110 shadow-md shadow-primary/10'
                      : 'bg-secondary/40 border-border/50 hover:bg-secondary hover:scale-105'
                  }`}
                  title={av.label}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-2xl cursor-pointer hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 active:scale-98"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Cadastrar e Começar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-foreground/60">
          Já possui uma conta?{' '}
          <button
            onClick={() => router.push('/login')}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            Fazer Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
