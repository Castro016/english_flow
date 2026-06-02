import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isRateLimited } from '@/lib/security/limiter';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 2. Apply rate limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rate:ai-explain:${user.id}:${ip}`;
    const limited = await isRateLimited(rateLimitKey, 20, 60); // 20 requests per minute
    if (limited) {
      return NextResponse.json(
        { error: 'Muitas solicitações. Aguarde um momento antes de pedir outra explicação.' },
        { status: 429 }
      );
    }

    // 3. Parse and validate input
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json({ error: 'Texto inválido.' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.error('NVIDIA_API_KEY is not configured inside env variables.');
      return NextResponse.json({ error: 'Serviço de IA indisponível no momento.' }, { status: 500 });
    }

    // 4. Prompt instructions for translating and extracting vocabulary
    const systemPrompt = `You are "EnglishFlow language explainer". 
The user wants a breakdown of an English response from their tutor.
Provide:
1. A clear Portuguese translation of the text.
2. A breakdown of 2-3 key vocabulary words, idiomatic expressions, phrasal verbs, or grammatical structures with friendly explanations in Portuguese.
Output your response STRICTLY as a JSON object with this shape:
{
  "translation": "Tradução em português aqui.",
  "vocabulary": [
    {"word": "vocabulary word or idiom", "explanation": "explicação simples em português"}
  ]
}
Do not output any markdown formatting, backticks, thoughts, or wrappers around the JSON. Return ONLY the raw JSON string.`;

    // 5. Query the NIM LLM
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        max_tokens: 512,
        temperature: 0.20,
        top_p: 0.95,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA NIM API Error response (explain):', errorText);
      return NextResponse.json({ error: 'Erro ao se comunicar com o motor de IA.' }, { status: 502 });
    }

    const responseData = await response.json();
    const content = responseData.choices?.[0]?.message?.content || '{}';

    // Parse the result
    let parsedResult = { translation: 'Tradução não disponível.', vocabulary: [] };
    try {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI explain JSON:', content, e);
    }

    // 6. Security logging
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_EXPLAIN_INVOCATION_SUCCESS',
        ip,
        userAgent: req.headers.get('user-agent') || 'Unknown',
        details: JSON.stringify({ textLength: text.length }),
      },
    });

    return NextResponse.json({
      success: true,
      result: parsedResult,
    });
  } catch (error) {
    console.error('AI Explain Route Error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor de IA.' }, { status: 500 });
  }
}
