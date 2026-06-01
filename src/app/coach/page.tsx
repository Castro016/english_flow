'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  Sparkles, Send, Mic, Volume2, VolumeX, RefreshCw, MessageSquare,
  BookOpen, HelpCircle, Loader2, ArrowLeft, Bot, User as UserIcon,
  CheckCircle, Target, Award, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  correction?: string;
  cleanText?: string;
}

export default function AICoachPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Real-time fluency metrics
  const [fluencyScore, setFluencyScore] = useState(70);
  const [vocabVariety, setVocabVariety] = useState(65);
  const [wordCount, setWordCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const topics = [
    { id: 'interview', title: '💼 Entrevista de Emprego', desc: 'Pratique perguntas difíceis corporativas em inglês.', prompt: 'Hello! I am Oliver, your interviewer today. Welcome to EnglishFlow Corp. To start, could you please introduce yourself and tell me why you want this job?' },
    { id: 'travel', title: '✈️ Viagem & Aeroporto', desc: 'Simule check-in, imigração e pedir direções.', prompt: 'Hello passenger! Welcome to London Heathrow customs. May I please see your passport and details about where you will be staying during your trip?' },
    { id: 'restaurant', title: '🍔 Pedidos no Restaurante', desc: 'Faça um pedido formal e dialogue com o garçom.', prompt: 'Good evening! Welcome to The Bistro. Table for one? Here is your menu. What can I start you off with today?' },
    { id: 'casual', title: '☕ Conversa Casual', desc: 'Bata um papo leve sobre hobbies, filmes e rotina.', prompt: 'Hey there! How has your week been so far? Tell me about what you like to do in your free time, any exciting hobbies?' }
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle TTS (Text to Speech)
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // stop current speak
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 0.95; // slightly slower for better learning
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Helper to parse corrections from the Qwen response
  const parseResponse = (rawContent: string): { correction?: string; cleanText: string } => {
    const pattern = /💡\s*Dica de Fluência:\s*([\s\S]*?)(?=(?:\r?\n){2,}|$)/i;
    const match = rawContent.match(pattern);
    
    if (match) {
      const correction = match[0].trim();
      const cleanText = rawContent.replace(pattern, '').trim();
      return { correction, cleanText };
    }
    
    return { cleanText: rawContent };
  };

  // Start a specific conversation topic
  const handleSelectTopic = (topic: typeof topics[0]) => {
    setSelectedTopic(topic.title);
    const parsed = parseResponse(topic.prompt);
    
    const initialMsg: Message = {
      id: 'init-' + Date.now(),
      role: 'assistant',
      content: topic.prompt,
      timestamp: new Date(),
      correction: parsed.correction,
      cleanText: parsed.cleanText
    };

    setMessages([initialMsg]);
    setTimeout(() => speakText(parsed.cleanText), 400);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setLoading(true);

    // Append user message
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Calculate real-time metric updates based on text
    const words = userText.split(/\s+/).length;
    setWordCount(prev => prev + words);

    // Basic heuristic vocabulary calculations to gamify fluency
    const uniqueWords = new Set(userText.toLowerCase().match(/\b\w+\b/g) || []).size;
    const varietyRatio = Math.min(100, Math.round((uniqueWords / Math.max(1, words)) * 100));
    setVocabVariety(prev => Math.min(100, Math.round((prev * 4 + varietyRatio) / 5)));
    
    // Fluency goes up with longer interactive entries (sentence structure complexity support)
    const sentenceScore = Math.min(100, Math.round(50 + (words * 2.5)));
    setFluencyScore(prev => Math.min(100, Math.round((prev * 4 + sentenceScore) / 5)));

    try {
      // 1. Prepare history array formatted for api route
      const apiPayload = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // 2. Call our secure NVIDIA Qwen route
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiPayload,
          userLevel: `Nível ${user?.level || 1} (XP: ${user?.xp || 0})`
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao obter resposta do Coach.');
      }

      const replyData = await res.json();
      
      if (replyData.error) {
        throw new Error(replyData.error);
      }

      const parsed = parseResponse(replyData.content);

      // Append AI Reply
      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: replyData.content,
        timestamp: new Date(),
        correction: parsed.correction,
        cleanText: parsed.cleanText
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(parsed.cleanText);

    } catch (err: any) {
      console.error(err);
      // Fallback message inside chat if API fails
      setMessages(prev => [...prev, {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: '💡 Dica de Fluência: Connection timeout. Let\'s check network configurations.\n\nSorry, I encountered a temporary connection issue. Can you try repeating that or starting a new topic?',
        timestamp: new Date(),
        cleanText: 'Sorry, I encountered a temporary connection issue. Can you try repeating that or starting a new topic?'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTopic(null);
    setMessages([]);
    setWordCount(0);
    setFluencyScore(70);
    setVocabVariety(65);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-6 relative z-10 w-full h-[calc(100vh-4rem)]">
      {/* Background aesthetics */}
      <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-lg h-full">
        {/* Chat Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-card/65 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 border border-border rounded-xl hover:bg-secondary/40 transition-colors active:scale-95 text-foreground/80 hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-lg shadow-md shadow-sky-500/10">
                🤖
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm leading-none">Coach Oliver</h4>
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-extrabold text-primary border border-primary/20 leading-none">
                  QWEN-122B
                </span>
              </div>
              <p className="text-[10px] text-foreground/50 font-medium mt-1">Treinador de Conversação & Fluência</p>
            </div>
          </div>

          {selectedTopic && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={`p-2 border border-border rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-semibold ${
                  voiceEnabled 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-secondary/40 text-foreground/60'
                }`}
                title={voiceEnabled ? "Desativar voz da IA" : "Ativar voz da IA"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span className="hidden sm:inline">{voiceEnabled ? "Áudio On" : "Mudo"}</span>
              </button>
              <button
                onClick={handleReset}
                className="p-2 border border-border rounded-xl hover:bg-secondary/40 transition-colors active:scale-95 text-foreground/75 cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Inner Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-secondary/10">
          {!selectedTopic ? (
            /* Setup Screen: Select Topic */
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center max-w-2xl mx-auto overflow-y-auto">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-3xl shadow-xl shadow-sky-500/10 mb-5 animate-bounce-slow">
                💬
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Pratique sua Conversação com IA!
              </h2>
              <p className="text-sm text-foreground/60 mb-8 max-w-md leading-relaxed">
                Escolha um dos cenários reais abaixo para iniciar um diálogo com nosso tutor inteligente. Ele vai te guiar e dar dicas de correção em tempo real para destravar sua fluência!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 text-left transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group h-36"
                  >
                    <div>
                      <h5 className="font-bold text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                        {topic.title}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                      </h5>
                      <p className="text-xs text-foreground/50 mt-1 leading-normal line-clamp-2">
                        {topic.desc}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md self-start">
                      Falar em Inglês
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Panel */
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Chat bubbles list */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Icon profile */}
                    <div className={`h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-secondary border border-border text-foreground'
                        : 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-semibold'
                    }`}>
                      {msg.role === 'user' ? '🦁' : '🦉'}
                    </div>

                    {/* Chat Bubble Body */}
                    <div className="space-y-1.5 flex-1">
                      {/* Dica de Fluência box (Extracted and rendered in yellow callout) */}
                      {msg.role === 'assistant' && msg.correction && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-foreground/80 leading-normal flex items-start gap-2 max-w-full">
                          <span className="shrink-0 text-base leading-none">💡</span>
                          <div>
                            <span className="font-extrabold text-amber-500 block mb-0.5">Dica de Correção</span>
                            <span className="font-medium">{msg.correction.replace(/💡\s*Dica de Fluência:\s*/i, '')}</span>
                          </div>
                        </div>
                      )}

                      {/* Main Message bubble */}
                      <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/10 rounded-tr-none'
                          : 'bg-card border border-border shadow-sm rounded-tl-none text-foreground/90'
                      }`}>
                        {msg.role === 'assistant' ? msg.cleanText : msg.content}
                      </div>

                      {/* Read audio action */}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => speakText(msg.cleanText || msg.content)}
                          className="px-2.5 py-1 text-[10px] font-bold text-primary hover:text-primary/95 flex items-center gap-1 transition-all cursor-pointer hover:underline"
                        >
                          <Volume2 className="h-3 w-3" />
                          Ouvir Pronúncia
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto items-start">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center text-sm shadow-sm shrink-0">
                      🦉
                    </div>
                    <div className="p-4 bg-card border border-border shadow-sm rounded-3xl rounded-tl-none flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      <span className="text-xs text-foreground/60 font-semibold animate-pulse">Oliver está pensando...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form Box */}
              <div className="p-4 border-t border-border/60 bg-card/75 backdrop-blur-md shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder="Responda em inglês para treinar sua escrita..."
                    className="flex-1 px-4 py-3 bg-secondary/35 border border-border/70 hover:border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl text-sm placeholder:text-foreground/45 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-5 bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-secondary disabled:text-foreground/40 rounded-2xl text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:scale-100 disabled:shadow-none"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI Tutor & Fluency Evaluation stats */}
      <div className="w-full lg:w-80 shrink-0 space-y-6 flex flex-col justify-start h-auto lg:h-full lg:overflow-y-auto">
        {/* Oliver Profile Card */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-4 text-center shrink-0">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-4xl shadow-xl shadow-sky-500/10">
            🦉
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Oliver • AI English Tutor</h3>
            <p className="text-xs text-foreground/50 font-semibold mt-1">Especialista em Pronúncia & Conversa</p>
          </div>
          <div className="p-3 bg-secondary/15 rounded-2xl text-[11px] text-foreground/75 leading-relaxed font-medium">
            "A melhor maneira de atingir a fluência é errando e corrigindo sem medo. Estou aqui para guiar suas frases!"
          </div>
        </div>

        {/* Real-time Fluency Evaluator Dashboard */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-5 flex-1 shrink-0">
          <h4 className="font-extrabold text-sm border-b border-border/40 pb-2 flex items-center gap-1.5">
            <Target className="h-4.5 w-4.5 text-primary" />
            <span>Avaliação de Fluência IA</span>
          </h4>

          {/* Metric: Fluency Score */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-foreground/75">
              <span>Fluência de Sentenças</span>
              <span className="font-bold text-sky-500">{fluencyScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                style={{ width: `${fluencyScore}%` }} 
              />
            </div>
            <p className="text-[10px] text-foreground/45">Baseado no tamanho e na agilidade de resposta.</p>
          </div>

          {/* Metric: Vocab Variety */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-foreground/75">
              <span>Variedade de Vocabulário</span>
              <span className="font-bold text-indigo-500">{vocabVariety}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${vocabVariety}%` }} 
              />
            </div>
            <p className="text-[10px] text-foreground/45">Mede a repetição e a riqueza lexical das suas frases.</p>
          </div>

          {/* Metric: Chat Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-secondary/15 rounded-xl border border-border/20 text-center">
              <span className="text-lg font-black text-primary leading-none block">{messages.filter(m => m.role === 'user').length}</span>
              <span className="text-[9px] text-foreground/50 font-bold uppercase tracking-wider">Turnos Salvos</span>
            </div>
            <div className="p-3 bg-secondary/15 rounded-xl border border-border/20 text-center">
              <span className="text-lg font-black text-primary leading-none block">{wordCount}</span>
              <span className="text-[9px] text-foreground/50 font-bold uppercase tracking-wider">Palavras Ditas</span>
            </div>
          </div>

          {/* Pedagogy target recommendation */}
          <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-2xl flex items-start gap-2">
            <Zap className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-foreground/70 leading-normal font-medium">
              <span className="font-bold text-sky-500 block mb-0.5">Meta de Fluência</span>
              Escreva respostas com 8 palavras ou mais. Oliver vai te dar dicas complexas e acelerar seu aprendizado!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
