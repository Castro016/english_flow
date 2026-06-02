import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isRateLimited } from '@/lib/security/limiter';

export async function POST(req: Request) {
  try {
    // 1. Authenticate session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 2. IP & User rate limiting (prevent API key exhaustion)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rate:ai-coach:${user.id}:${ip}`;
    const limited = await isRateLimited(rateLimitKey, 15, 60); // 15 requests per minute
    if (limited) {
      return NextResponse.json(
        { error: 'Muitas consultas à IA. Por favor, aguarde um momento.' },
        { status: 429 }
      );
    }

    const { messages, userLevel } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensagens inválidas.' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.error('NVIDIA_API_KEY is not configured inside env variables.');
      return NextResponse.json({ error: 'Serviço de IA temporariamente indisponível.' }, { status: 500 });
    }

    // 3. Craft strict pedagogical tutoring system prompt
    const systemPrompt = `You are "Coach Oliver", an elite AI English Tutor & Conversation Partner at EnglishFlow. 
Your goal is to help the user speak fluent English through active conversation.
Follow these pedagogical instructions strictly:
1. Always respond in warm, polite, natural, and encouraging English.
2. Adapt your vocabulary complexity to the user's level (current level: ${userLevel || 'Beginner A1-A2'}).
3. Critical Rule: If the user makes any grammatical, punctuation, spelling, or styling errors, provide a brief, friendly correction block at the very top of your reply, written in Portuguese. Wrap it inside a markdown block labeled "💡 Dica de Fluência:". For example:
   "💡 Dica de Fluência: Em vez de 'I have 20 years', use 'I am 20 years old'."
   Then continue your conversation in English.
4. Keep your responses short, interactive, and conversational (max 3-4 sentences).
5. Always end your response with an open-ended, engaging question matching the topic to keep the conversation going!
6. Never write full translations of your responses unless explicitly requested. Encourage the user to express themselves!`;

    // 4. Build message payload for API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    // 5. Send POST request using native fetch to NVIDIA NIM endpoint
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: formattedMessages,
        max_tokens: 1024,
        temperature: 0.70,
        top_p: 0.95,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA NIM API Error response:', errorText);
      return NextResponse.json({ error: 'Erro ao se comunicar com o motor de IA.' }, { status: 502 });
    }

    const responseData = await response.json();
    const aiReply = responseData.choices?.[0]?.message?.content || 'I could not process that, let\'s try again!';

    // 6. Write to security audit log
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_COACH_INVOCATION_SUCCESS',
        ip,
        userAgent,
        details: JSON.stringify({ messageCount: messages.length, model: 'qwen3.5-122b' }),
      },
    });

    return NextResponse.json({
      success: true,
      content: aiReply,
    });
  } catch (error) {
    console.error('AI Coach Route Error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor de IA.' }, { status: 500 });
  }
}
