'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { useAuth } from './auth-provider';
import { useTheme } from './theme-provider';
import { Sparkles, Flame, User as UserIcon, LogOut, ShieldAlert, Sun, Moon, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show regular navbar inside the gamified Lesson Playroom to maintain total focus
  if (pathname?.startsWith('/lesson/')) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full transition-all glass duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(user ? '/dashboard' : '/')}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white animate-float">
                <Sparkles className="h-5.5 w-5.5 fill-white/10" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                EnglishFlow
              </span>
            </button>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    isActive('/dashboard') ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  Painel de Estudo
                </button>
                <button
                  onClick={() => router.push('/coach')}
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    isActive('/coach') ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  Conversar com IA
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    isActive('/profile') ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  Meu Perfil
                </button>
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer text-amber-500 hover:text-amber-600 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Admin
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => router.push('/')}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  isActive('/') ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                Início
              </button>
            )}
          </nav>

          {/* Actions / User profile info */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-secondary/80 text-foreground hover:bg-secondary border border-border/40 cursor-pointer transition-transform active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                {/* Streak flame */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-semibold text-sm">
                  <Flame className="h-4.5 w-4.5 fill-orange-500" />
                  <span>{user.streak} dias</span>
                </div>

                {/* Level Badge */}
                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 font-bold text-sm">
                  <span>Nível {user.level}</span>
                </div>

                {/* Profile menu */}
                <button
                  onClick={() => router.push('/profile')}
                  className="flex items-center gap-2 cursor-pointer focus:outline-none"
                >
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/10 border border-white/10 text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer border border-transparent hover:border-destructive/20 transition-all active:scale-95"
                  title="Sair"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm font-medium hover:text-primary transition-colors cursor-pointer px-4 py-2"
                >
                  Entrar
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 transition-all shadow-md shadow-primary/20 px-4 py-2 rounded-xl cursor-pointer hover:-translate-y-0.5 duration-200"
                >
                  Começar Grátis
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-secondary/80 text-foreground hover:bg-secondary cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-foreground/80 hover:text-foreground cursor-pointer focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-border/40 px-4 pt-2 pb-4 space-y-3">
          {user ? (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-none">{user.name}</div>
                    <div className="text-xs text-foreground/60">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-xs text-orange-500 font-bold px-2 py-0.5 bg-orange-500/10 rounded-md">
                    <Flame className="h-3 w-3 fill-orange-500" />
                    {user.streak}d
                  </div>
                  <div className="text-xs text-sky-500 font-bold px-2 py-0.5 bg-sky-500/10 rounded-md">
                    Nív {user.level}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/dashboard');
                }}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm font-medium cursor-pointer ${
                  isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/40'
                }`}
              >
                Painel de Estudo
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/coach');
                }}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm font-medium cursor-pointer ${
                  isActive('/coach') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/40'
                }`}
              >
                Conversar com IA
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/profile');
                }}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm font-medium cursor-pointer ${
                  isActive('/profile') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/40'
                }`}
              >
                Meu Perfil
              </button>

              {user.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/admin');
                  }}
                  className="flex w-full items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer text-amber-500 bg-amber-500/10 border border-amber-500/20"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Área Administrativa
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/');
                }}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm font-medium cursor-pointer ${
                  isActive('/') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/40'
                }`}
              >
                Início
              </button>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/login');
                  }}
                  className="w-full text-center px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary/40 cursor-pointer"
                >
                  Entrar
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/register');
                  }}
                  className="w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/95 shadow-md shadow-primary/15 cursor-pointer"
                >
                  Começar Grátis
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
