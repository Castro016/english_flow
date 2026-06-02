import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isRateLimited } from '@/lib/security/limiter';

export async function GET(req: Request) {
  try {
    // 1. Authenticate user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 2. Rate limit key (limit personal lesson generation to 3 per hour to prevent token abuse)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rate:personalized-lesson:${user.id}:${ip}`;
    const limited = await isRateLimited(rateLimitKey, 5, 300); // Max 5 dynamic generations every 5 minutes
    if (limited) {
      return NextResponse.json(
        { error: 'Você gerou muitas lições personalizadas recentemente. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }

    // 3. Gather user history to analyze hits and weaknesses
    const completedProgress = await prisma.progress.findMany({
      where: { userId: user.id, completed: true },
      include: { lesson: true },
    });

    const failedLogs = await prisma.auditLog.findMany({
      where: { userId: user.id, action: 'AUTH_LOGIN_FAILED' },
    });

    const completedLessonTitles = completedProgress.map((p) => p.lesson.title);
    const completedCount = completedProgress.length;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.error('NVIDIA_API_KEY is not configured inside env variables.');
      return NextResponse.json({ error: 'Serviço de IA temporariamente indisponível.' }, { status: 500 });
    }

    // 4. Construct high-fidelity system instructions for JSON generation
    const systemPrompt = `You are "Oliver's Curriculum Engine", an elite English pedagogy systems architect.
Your task is to analyze the user's progress and dynamically generate a customized English lesson.

User Profile details:
- Name: ${user.name}
- Current Level: Level ${user.level} (XP: ${user.xp})
- Streak: ${user.streak} days
- Total Completed Lessons: ${completedCount}
- Completed Lesson Areas: [${completedLessonTitles.join(', ') || 'Nenhuma lição concluída ainda'}]
- Recent System Failures (Security locks/mismatches): ${failedLogs.length} failed logins recorded

Pedagogical Analysis Rules:
1. Analyze their completed topics. If they have completed basic lessons (Greetings, Numbers), recommend next-step structures (e.g., Simple Past, Prepositions, Modal Verbs, Business Dialogues).
2. Design a highly specific, customized title that sounds premium: e.g., "Personalized: Master the Simple Past" or "Personalized: Airport Travel Essentials".
3. Write an introduction in Portuguese explaining why this lesson was generated for them based on their completed count of ${completedCount} lessons.
4. Supply exactly 3 relevant example expressions ({english, portuguese, hint}).
5. Generate exactly 5 highly interactive exercises of various types:
   - CHOICE: A multiple-choice question. "options" must be a JSON array of 4 unique options (strings).
   - DRAG: A word organizer question. "options" must be a JSON array of the constituent words scrambled (e.g. ["is", "she", "here"]).
   - BLANK: A fill-in-the-blank question. "options" must be an empty array [].
   - TRANSLATE: A Portuguese to English translation question. "options" must be an empty array [].
   - LISTEN: A listening dictation question. "options" must be an empty array [].

CRITICAL: You MUST respond exclusively in valid, clean JSON format. Do not wrap your response in markdown code blocks like \`\`\`json ... \`\`\`. Start with { and end with }. Ensure all keys and strings are double-quoted.

Required JSON Structure:
{
  "title": "Custom Lesson Title",
  "description": "Short pedagogical rationale for this user.",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "level": "A1" | "A2" | "B1" | "B2" | "C1",
  "introduction": "Theoretical explanation in Portuguese...",
  "examples": [
    { "english": "English phrase", "portuguese": "Tradução em Português", "hint": "Useful pedagogical hint" }
  ],
  "exercises": [
    {
      "type": "CHOICE",
      "question": "Question text...",
      "answer": "Correct Answer",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    },
    {
      "type": "DRAG",
      "question": "Arrange words: ...",
      "answer": "Correct Full Sentence",
      "options": ["word1", "word2", "word3"]
    },
    {
      "type": "BLANK",
      "question": "Fill the blank...",
      "answer": "missingword",
      "options": []
    },
    {
      "type": "TRANSLATE",
      "question": "Traduza: ...",
      "answer": "Translation",
      "options": []
    },
    {
      "type": "LISTEN",
      "question": "Listen and write...",
      "answer": "Sentence to dictate",
      "options": []
    }
  ]
}`;

    // 5. Call Qwen LLM using fetch
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 4096,
        temperature: 0.50,
        top_p: 0.90,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA NIM AI Lesson Generator Error:', errorText);
      return NextResponse.json({ error: 'Erro ao gerar a lição personalizada.' }, { status: 502 });
    }

    const responseData = await response.json();
    let aiResponseContent = responseData.choices?.[0]?.message?.content || '{}';

    // Strip markdown code block wraps if LLM adds them despite instructions
    aiResponseContent = aiResponseContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    // 6. Parse JSON safely to verify structure
    let parsedLesson;
    try {
      parsedLesson = JSON.parse(aiResponseContent);
      
      // Ensure arrays and required attributes are present
      if (!parsedLesson.title || !parsedLesson.exercises || !Array.isArray(parsedLesson.exercises)) {
        throw new Error('Missing core lesson elements in generated payload');
      }

      // Safeguard: Ensure exercises parsed options arrays correctly
      parsedLesson.exercises = parsedLesson.exercises.map((ex: any) => ({
        ...ex,
        options: typeof ex.options === 'string' ? JSON.parse(ex.options) : (ex.options || []),
      }));

    } catch (e) {
      console.error('Failed to parse AI generated JSON lesson payload. Raw was:', aiResponseContent);
      return NextResponse.json({ error: 'A inteligência artificial gerou um formato inválido. Tente novamente!' }, { status: 500 });
    }

    // 7. Write to audit log
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_PERSONALIZED_LESSON_GENERATED',
        ip,
        userAgent,
        details: JSON.stringify({ title: parsedLesson.title, exerciseCount: parsedLesson.exercises.length }),
      },
    });

    return NextResponse.json({
      success: true,
      lesson: parsedLesson,
    });
  } catch (error) {
    console.error('AI Personalized Lesson Route Error:', error);
    return NextResponse.json({ error: 'Erro interno ao criar lição dinâmica.' }, { status: 500 });
  }
}
