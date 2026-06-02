const { PrismaClient } = require('@prisma/client');
const { hash } = require('@node-rs/argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with extensive lessons...');

  // 1. Clean existing records
  await prisma.userAchievement.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.progress.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Achievements
  const achievements = [
    {
      name: 'Primeira Lição',
      description: 'Concluiu sua primeira lição com sucesso!',
      icon: 'award',
      requirement: 'FIRST_LESSON',
      value: 1,
      xpReward: 50,
    },
    {
      name: 'Superação Diária',
      description: 'Mantenha uma sequência de 7 dias de estudos.',
      icon: 'flame',
      requirement: 'STREAK_7',
      value: 7,
      xpReward: 150,
    },
    {
      name: 'Maratonista',
      description: 'Mantenha uma sequência de 30 dias de estudos.',
      icon: 'calendar',
      requirement: 'STREAK_30',
      value: 30,
      xpReward: 500,
    },
    {
      name: 'Acumulador de Conhecimento',
      description: 'Alcance um total de 1.000 XP.',
      icon: 'zap',
      requirement: 'XP_1000',
      value: 1000,
      xpReward: 100,
    },
    {
      name: 'Estudioso Dedicado',
      description: 'Conclua um total de 10 lições.',
      icon: 'book-open',
      requirement: 'LESSONS_10',
      value: 10,
      xpReward: 200,
    },
    {
      name: 'Perfeccionista',
      description: 'Responda 50 exercícios com sucesso.',
      icon: 'check-circle',
      requirement: 'EXERCISES_50',
      value: 50,
      xpReward: 150,
    }
  ];

  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach });
  }
  console.log('Achievements seeded!');

  // 3. Create Admin and Regular User
  const adminPassword = await hash('FlowAdminSecure#2026!', {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
  });
  const userPassword = await hash('user123', {
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
    parallelism: 4,
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'manager@englishflow.com',
      avatar: 'avatar_admin',
      password: adminPassword,
      role: 'ADMIN',
      xp: 150,
      level: 2,
      streak: 5,
    }
  });

  const normalUser = await prisma.user.create({
    data: {
      name: 'Carlos Oliveira',
      email: 'carlos@gmail.com',
      password: userPassword,
      avatar: 'avatar_user',
      role: 'USER',
      xp: 45,
      level: 1,
      streak: 2,
    }
  });

  console.log('Users seeded!');

  // 4. Create Lessons & Exercises

  // ==================== LEVEL A1 ====================
  
  // Lesson 1: Saudações (Greetings)
  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'Saudações & Apresentações',
      description: 'Aprenda a cumprimentar pessoas e a se apresentar em inglês de forma natural.',
      difficulty: 'EASY',
      level: 'A1',
      introduction: 'As saudações são a porta de entrada para qualquer idioma. Em inglês, usamos expressões diferentes dependendo do nível de formalidade e da hora do dia.',
      examples: JSON.stringify([
        { english: 'Hello', portuguese: 'Olá / Oi', hint: 'Usado a qualquer momento' },
        { english: 'Good Morning', portuguese: 'Bom dia', hint: 'Usado antes do meio-dia' },
        { english: 'My name is John', portuguese: 'Meu nome é John', hint: 'Para se apresentar' },
        { english: 'Nice to meet you', portuguese: 'Prazer em te conhecer', hint: 'Resposta simpática ao conhecer alguém' }
      ])
    }
  });

  const exercisesL1 = [
    {
      type: 'CHOICE',
      question: 'Como se diz "Bom dia" em inglês?',
      answer: 'Good Morning',
      options: JSON.stringify(['Good Night', 'Good Morning', 'Good Afternoon', 'Goodbye'])
    },
    {
      type: 'DRAG',
      question: 'Organize a frase de apresentação: "Meu nome é Carlos"',
      answer: 'My name is Carlos',
      options: JSON.stringify(['name', 'Carlos', 'is', 'My'])
    },
    {
      type: 'BLANK',
      question: 'Complete com a palavra correta: Nice ____ meet you.',
      answer: 'to',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o português: "Hello, how are you?"',
      answer: 'Olá, como vai você?',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and type what you hear:',
      answer: 'Welcome to EnglishFlow',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesL1) {
    await prisma.exercise.create({ data: { lessonId: lesson1.id, ...ex } });
  }

  // Lesson 2: Números (Numbers)
  const lesson2 = await prisma.lesson.create({
    data: {
      title: 'Os Números de 1 a 10',
      description: 'Aprenda a contar em inglês e fale sobre números de telefone e idades.',
      difficulty: 'EASY',
      level: 'A1',
      introduction: 'Contar é crucial para preços, idades e números de contato. Vamos aprender os números básicos de um a dez.',
      examples: JSON.stringify([
        { english: 'One, Two, Three', portuguese: 'Um, Dois, Três', hint: 'Os primeiros números' },
        { english: 'Four, Five, Six', portuguese: 'Quatro, Cinco, Seis', hint: 'A continuação' },
        { english: 'I am seven years old', portuguese: 'Eu tenho sete anos de idade', hint: 'Em inglês expressamos idade usando "to be" + years old' }
      ])
    }
  });

  const exercisesL2 = [
    {
      type: 'CHOICE',
      question: 'Como se diz o número "8" em inglês?',
      answer: 'Eight',
      options: JSON.stringify(['Seven', 'Nine', 'Eight', 'Ten'])
    },
    {
      type: 'DRAG',
      question: 'Organize os números em ordem crescente: 1, 2, 3',
      answer: 'One Two Three',
      options: JSON.stringify(['Two', 'One', 'Three'])
    },
    {
      type: 'BLANK',
      question: 'Complete com a palavra que falta: One, two, three, ____, five.',
      answer: 'four',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o inglês: "Eu tenho nove anos de idade"',
      answer: 'I am nine years old',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write down the numbers:',
      answer: 'One five eight',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesL2) {
    await prisma.exercise.create({ data: { lessonId: lesson2.id, ...ex } });
  }

  // Lesson 3: Cores (Colors)
  const lesson3 = await prisma.lesson.create({
    data: {
      title: 'As Cores Básicas',
      description: 'Identifique e descreva objetos usando as cores em inglês.',
      difficulty: 'EASY',
      level: 'A1',
      introduction: 'Adjetivos como cores vêm ANTES do substantivo em inglês. Por exemplo: "a blue car" (um carro azul).',
      examples: JSON.stringify([
        { english: 'Red apple', portuguese: 'Maçã vermelha', hint: 'Red = Vermelho' },
        { english: 'Blue sky', portuguese: 'Céu azul', hint: 'Blue = Azul' },
        { english: 'The house is green', portuguese: 'A casa é verde', hint: 'Green = Verde' }
      ])
    }
  });

  const exercisesL3 = [
    {
      type: 'CHOICE',
      question: 'Qual cor representa o sol em inglês?',
      answer: 'Yellow',
      options: JSON.stringify(['Yellow', 'Black', 'Purple', 'Orange'])
    },
    {
      type: 'DRAG',
      question: 'Organize: "Uma maçã vermelha"',
      answer: 'A red apple',
      options: JSON.stringify(['apple', 'red', 'A'])
    },
    {
      type: 'BLANK',
      question: 'O mar é azul. Complete: The ocean is ____.',
      answer: 'blue',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o inglês: "O carro verde é lindo"',
      answer: 'The green car is beautiful',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and type what you hear:',
      answer: 'My favorite color is green',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesL3) {
    await prisma.exercise.create({ data: { lessonId: lesson3.id, ...ex } });
  }

  // Lesson 4: Família (Family) - NEW!
  const lessonFamily = await prisma.lesson.create({
    data: {
      title: 'Membros da Família',
      description: 'Aprenda a descrever seus parentes e falar sobre sua árvore genealógica.',
      difficulty: 'EASY',
      level: 'A1',
      introduction: 'Conhecer os termos familiares ajuda a falar sobre sua vida pessoal e conexões. Vamos aprender os membros centrais da família.',
      examples: JSON.stringify([
        { english: 'Mother / Father', portuguese: 'Mãe / Pai', hint: 'Pais biológicos' },
        { english: 'Sister / Brother', portuguese: 'Irmã / Irmão', hint: 'Irmãos diretos' },
        { english: 'This is my daughter', portuguese: 'Esta é minha filha', hint: 'Daughter = Filha' }
      ])
    }
  });

  const exercisesFamily = [
    {
      type: 'CHOICE',
      question: 'O que significa a palavra "Brother"?',
      answer: 'Irmão',
      options: JSON.stringify(['Tio', 'Irmão', 'Pai', 'Avô'])
    },
    {
      type: 'DRAG',
      question: 'Organize: "Ela é minha mãe"',
      answer: 'She is my mother',
      options: JSON.stringify(['is', 'mother', 'She', 'my'])
    },
    {
      type: 'BLANK',
      question: 'O oposto de "Mother" é ____.',
      answer: 'father',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o português: "My brother is tall."',
      answer: 'Meu irmão é alto.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write what you hear:',
      answer: 'I love my family',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesFamily) {
    await prisma.exercise.create({ data: { lessonId: lessonFamily.id, ...ex } });
  }


  // ==================== LEVEL A2 ====================
  
  // Lesson 5: Rotina Diária (Daily Routine)
  const lesson5 = await prisma.lesson.create({
    data: {
      title: 'Minha Rotina Diária',
      description: 'Aprenda a falar sobre suas atividades cotidianas e horários.',
      difficulty: 'MEDIUM',
      level: 'A2',
      introduction: 'Para descrever rotinas diárias no Simple Present, usamos verbos de ação na sua forma básica para I, You, We, They, e adicionamos "s" ou "es" para He, She, It.',
      examples: JSON.stringify([
        { english: 'I wake up at 7 AM', portuguese: 'Eu acordo às 7 da manhã', hint: 'Wake up = Acordar' },
        { english: 'She goes to work by bus', portuguese: 'Ela vai para o trabalho de ônibus', hint: 'Nota o "es" no verbo "go"' },
        { english: 'I have breakfast with my family', portuguese: 'Eu tomo café da manhã com minha família', hint: 'Have breakfast = Tomar café da manhã' }
      ])
    }
  });

  const exercisesL5 = [
    {
      type: 'CHOICE',
      question: 'Como se diz "Tirar um cochilo" em inglês?',
      answer: 'Take a nap',
      options: JSON.stringify(['Take a nap', 'Go to sleep', 'Wake up', 'Have lunch'])
    },
    {
      type: 'DRAG',
      question: 'Organize a frase: "Eu acordo cedo todo dia"',
      answer: 'I wake up early every day',
      options: JSON.stringify(['up', 'wake', 'day', 'early', 'every', 'I'])
    },
    {
      type: 'BLANK',
      question: 'Complete com o verbo na forma correta: He ____ (go) to bed at 10 PM.',
      answer: 'goes',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o inglês: "Eu tomo café da manhã às oito horas."',
      answer: 'I have breakfast at eight o\'clock.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write what you hear:',
      answer: 'She works every morning',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesL5) {
    await prisma.exercise.create({ data: { lessonId: lesson5.id, ...ex } });
  }

  // Lesson 6: Alimentação (Food & Restaurant) - NEW!
  const lessonFood = await prisma.lesson.create({
    data: {
      title: 'Alimentação & Restaurante',
      description: 'Aprenda a fazer pedidos em restaurantes e falar sobre suas comidas favoritas.',
      difficulty: 'MEDIUM',
      level: 'A2',
      introduction: 'Pedir comida em inglês exige frases gentis de solicitação como "I would like" (Gostaria de) ou "Can I have" (Poderia me trazer).',
      examples: JSON.stringify([
        { english: 'I would like a glass of water', portuguese: 'Gostaria de um copo de água', hint: 'I would like = Gostaria de' },
        { english: 'Can I see the menu, please?', portuguese: 'Pode me mostrar o cardápio, por favor?', hint: 'Menu = Cardápio' },
        { english: 'The bill, please', portuguese: 'A conta, por favor', hint: 'Bill = Conta' }
      ])
    }
  });

  const exercisesFood = [
    {
      type: 'CHOICE',
      question: 'Como se diz "Garçom" em inglês?',
      answer: 'Waiter',
      options: JSON.stringify(['Waiter', 'Cook', 'Manager', 'Cashier'])
    },
    {
      type: 'DRAG',
      question: 'Organize: "Gostaria de uma maçã"',
      answer: 'I would like an apple',
      options: JSON.stringify(['like', 'an', 'would', 'apple', 'I'])
    },
    {
      type: 'BLANK',
      question: 'Complete com a palavra que falta: Can I have the ____, please? (A conta)',
      answer: 'bill',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o inglês: "Este frango está delicioso."',
      answer: 'This chicken is delicious.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write:',
      answer: 'A cup of coffee',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesFood) {
    await prisma.exercise.create({ data: { lessonId: lessonFood.id, ...ex } });
  }


  // ==================== LEVEL B1 ====================
  
  // Lesson 7: Present Perfect
  const lesson7 = await prisma.lesson.create({
    data: {
      title: 'Tempos Verbais: Present Perfect',
      description: 'Compreenda o Present Perfect para falar de experiências vividas.',
      difficulty: 'HARD',
      level: 'B1',
      introduction: 'O Present Perfect é formado por subject + have/has + past participle. Ele conecta ações do passado com o presente, sem focar no tempo exato em que ocorreram.',
      examples: JSON.stringify([
        { english: 'I have visited London twice', portuguese: 'Eu visitei Londres duas vezes', hint: 'Não especifica quando' },
        { english: 'She has lost her keys', portuguese: 'Ela perdeu suas chaves', hint: 'Efeito relevante no presente' }
      ])
    }
  });

  const exercisesL7 = [
    {
      type: 'CHOICE',
      question: 'Qual a forma correta do Present Perfect para "They (live) here"?',
      answer: 'They have lived here',
      options: JSON.stringify(['They lived here', 'They have lived here', 'They has lived here', 'They are living here'])
    },
    {
      type: 'DRAG',
      question: 'Organize: "Ela já terminou o dever"',
      answer: 'She has already finished the homework',
      options: JSON.stringify(['finished', 'has', 'already', 'homework', 'the', 'She'])
    },
    {
      type: 'BLANK',
      question: 'Complete a frase: We have ____ (see) that movie already.',
      answer: 'seen',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza para o inglês: "Você já comeu sushi?"',
      answer: 'Have you ever eaten sushi?',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write what you hear:',
      answer: 'I have never been to Brazil',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesL7) {
    await prisma.exercise.create({ data: { lessonId: lesson7.id, ...ex } });
  }


  // ==================== LEVEL B2 ====================

  // Lesson 8: Expressões Idiomáticas (Idioms) - NEW!
  const lessonIdioms = await prisma.lesson.create({
    data: {
      title: 'Expressões Idiomáticas',
      description: 'Fale como um nativo dominando as principais expressões e gírias do dia a dia.',
      difficulty: 'HARD',
      level: 'B2',
      introduction: 'Expressões idiomáticas não podem ser traduzidas literalmente palavra por palavra. Elas carregam significados culturais figurados cruciais para a fluência.',
      examples: JSON.stringify([
        { english: 'A piece of cake', portuguese: 'Algo muito fácil (mamão com açúcar)', hint: 'Literalmente: um pedaço de bolo' },
        { english: 'Under the weather', portuguese: 'Sentir-se indisposto / doentinho', hint: 'Literalmente: sob o clima' },
        { english: 'Break a leg', portuguese: 'Boa sorte! (usado no teatro/artes)', hint: 'Literalmente: quebre uma perna' }
      ])
    }
  });

  const exercisesIdioms = [
    {
      type: 'CHOICE',
      question: 'O que significa a expressão "A piece of cake"?',
      answer: 'Algo muito fácil',
      options: JSON.stringify(['Comer um bolo', 'Algo muito fácil', 'Uma tarefa impossível', 'Estar confuso'])
    },
    {
      type: 'DRAG',
      question: 'Organize: "Estar indisposto"',
      answer: 'Feel under the weather',
      options: JSON.stringify(['the', 'under', 'weather', 'Feel'])
    },
    {
      type: 'BLANK',
      question: 'Para desejar boa sorte a um ator, dizemos: "Break a ____!"',
      answer: 'leg',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza a expressão: "This exam was a piece of cake."',
      answer: 'Esta prova foi muito fácil.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write:',
      answer: 'I am feeling under the weather',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesIdioms) {
    await prisma.exercise.create({ data: { lessonId: lessonIdioms.id, ...ex } });
  }


  // ==================== LEVEL C1 ====================

  // Lesson 9: Entrevista de Emprego (Job Interview) - NEW!
  const lessonInterview = await prisma.lesson.create({
    data: {
      title: 'Entrevista de Emprego & Negócios',
      description: 'Prepare-se para processos seletivos internacionais e reuniões corporativas.',
      difficulty: 'HARD',
      level: 'C1',
      introduction: 'O inglês profissional (Business English) requer clareza, termos de liderança corporativa, apresentação de métricas de impacto e um vocabulário formal polido.',
      examples: JSON.stringify([
        { english: 'Can you walk me through your resume?', portuguese: 'Pode me guiar pelo seu currículo?', hint: 'Pergunda clássica de entrevistas' },
        { english: 'I have a strong track record of success', portuguese: 'Tenho um histórico sólido de sucesso', hint: 'Ótimo para demonstrar valor' },
        { english: 'To think outside the box', portuguese: 'Pensar de forma inovadora (fora da caixa)', hint: 'Expressão corporativa' }
      ])
    }
  });

  const exercisesInterview = [
    {
      type: 'CHOICE',
      question: 'O que significa a expressão corporativa "Think outside the box"?',
      answer: 'Pensar de forma inovadora',
      options: JSON.stringify(['Trabalhar em cubículos', 'Pensar de forma inovadora', 'Guardar segredos', 'Organizar caixas'])
    },
    {
      type: 'DRAG',
      question: 'Organize a resposta: "Tenho um histórico sólido de sucesso"',
      answer: 'I have a strong track record',
      options: JSON.stringify(['have', 'strong', 'track', 'record', 'a', 'I'])
    },
    {
      type: 'BLANK',
      question: 'Complete com a preposição correta: Walk me ____ your resume, please.',
      answer: 'through',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza: "I am looking for new professional challenges."',
      answer: 'Estou procurando novos desafios profissionais.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write:',
      answer: 'We need to think outside the box',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesInterview) {
    await prisma.exercise.create({ data: { lessonId: lessonInterview.id, ...ex } });
  }

  // Lesson 10: Viagem & Aeroporto (Travel & Airport Essentials)
  const lessonTravel = await prisma.lesson.create({
    data: {
      title: 'Viagem & Aeroporto',
      description: 'Aprenda expressões essenciais para se comunicar em aeroportos, hotéis e alfândega.',
      difficulty: 'MEDIUM',
      level: 'B2',
      introduction: 'Viajar requer um vocabulário prático para evitar imprevistos. É essencial saber pedir ajuda, fazer check-in de bagagem e responder aos oficiais de imigração.',
      examples: JSON.stringify([
        { english: 'I would like to check this bag', portuguese: 'Eu gostaria de despachar esta mala', hint: 'Usado no balcão de check-in' },
        { english: 'Where is the boarding gate?', portuguese: 'Onde fica o portão de embarque?', hint: 'Para se localizar no terminal' },
        { english: 'Please fasten your seatbelts', portuguese: 'Por favor, afivelem seus cintos', hint: 'Instrução clássica de bordo' }
      ])
    }
  });

  const exercisesTravel = [
    {
      type: 'CHOICE',
      question: 'Como você diz "Eu gostaria de despachar esta mala" em inglês?',
      answer: 'I would like to check this bag',
      options: JSON.stringify(['I would like to buy a bag', 'I would like to check this bag', 'Where is my bag?', 'Please open this bag'])
    },
    {
      type: 'DRAG',
      question: 'Organize a pergunta: "Onde fica o portão de embarque?"',
      answer: 'Where is the boarding gate',
      options: JSON.stringify(['boarding', 'gate', 'Where', 'is', 'the'])
    },
    {
      type: 'BLANK',
      question: 'Complete com a palavra que falta: Please show me your passport and boarding ____.',
      answer: 'pass',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza: "The flight is delayed by two hours."',
      answer: 'O voo está atrasado em duas horas.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write what you hear:',
      answer: 'Please fasten your seatbelts',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesTravel) {
    await prisma.exercise.create({ data: { lessonId: lessonTravel.id, ...ex } });
  }

  // Lesson 11: Negociações & Business Meetings (Negotiating in English)
  const lessonNeg = await prisma.lesson.create({
    data: {
      title: 'Negociações & Business Meetings',
      description: 'Aprenda a expor propostas, discordar educadamente e fechar acordos corporativos.',
      difficulty: 'HARD',
      level: 'C1',
      introduction: 'Negociar em inglês exige domínio de termos diplomáticos, expressões formais de concordância/discordância e técnicas para propor concessões (trade-offs).',
      examples: JSON.stringify([
        { english: 'To reach a compromise', portuguese: 'Chegar a um acordo mútuo (concessão)', hint: 'Essencial em negociações' },
        { english: 'I agree with your proposal', portuguese: 'Eu concordo com a sua proposta', hint: 'Concordância formal' },
        { english: 'A win-win situation', portuguese: 'Uma situação em que todos ganham', hint: 'Expressão idiomática de benefício mútuo' }
      ])
    }
  });

  const exercisesNeg = [
    {
      type: 'CHOICE',
      question: 'O que significa a expressão corporativa "Reach a compromise"?',
      answer: 'Chegar a um acordo mútuo',
      options: JSON.stringify(['Discutir sem parar', 'Chegar a um acordo mútuo', 'Romper o contrato', 'Aumentar os preços'])
    },
    {
      type: 'DRAG',
      question: 'Organize a resposta: "Eu concordo com a sua proposta"',
      answer: 'I agree with your proposal',
      options: JSON.stringify(['with', 'proposal', 'agree', 'I', 'your'])
    },
    {
      type: 'BLANK',
      question: 'Complete com a palavra corporativa: Let\'s sign the ____ to finalize the deal.',
      answer: 'contract',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza: "We need to negotiate a better price."',
      answer: 'Precisamos negociar um preço melhor.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write:',
      answer: 'That is a win win situation',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesNeg) {
    await prisma.exercise.create({ data: { lessonId: lessonNeg.id, ...ex } });
  }

  // Lesson 12: Opiniões & Debates (Expressing Opinions)
  const lessonOpinion = await prisma.lesson.create({
    data: {
      title: 'Opiniões & Debates',
      description: 'Expresse seus pontos de vista de forma confiante e aprenda a argumentar.',
      difficulty: 'MEDIUM',
      level: 'B1',
      introduction: 'Para debater e conversar fluentemente, você precisa saber introduzir suas ideias e contrastá-las com as dos outros usando expressões estruturadas.',
      examples: JSON.stringify([
        { english: 'In my opinion', portuguese: 'Na minha opinião', hint: 'Forma clássica' },
        { english: 'From my perspective', portuguese: 'Da minha perspectiva / ponto de vista', hint: 'Mais formal' },
        { english: 'I see your point, but I disagree', portuguese: 'Eu entendo o seu ponto de vista, mas discordo', hint: 'Discordância polida' }
      ])
    }
  });

  const exercisesOpinion = [
    {
      type: 'CHOICE',
      question: 'Qual expressão denota forte concordância com o interlocutor?',
      answer: 'I completely agree with you',
      options: JSON.stringify(['I completely agree with you', 'I strongly disagree', 'Maybe you are wrong', 'I do not care'])
    },
    {
      type: 'DRAG',
      question: 'Organize: "Da minha perspectiva, isto está correto"',
      answer: 'From my perspective this is correct',
      options: JSON.stringify(['this', 'is', 'perspective', 'correct', 'From', 'my'])
    },
    {
      type: 'BLANK',
      question: 'Complete a frase: In my ____, learning English is fun.',
      answer: 'opinion',
      options: JSON.stringify([])
    },
    {
      type: 'TRANSLATE',
      question: 'Traduza: "I see your point, but I disagree."',
      answer: 'Eu entendo o seu ponto de vista, mas discordo.',
      options: JSON.stringify([])
    },
    {
      type: 'LISTEN',
      question: 'Listen and write:',
      answer: 'I strongly believe in this project',
      options: JSON.stringify([])
    }
  ];

  for (const ex of exercisesOpinion) {
    await prisma.exercise.create({ data: { lessonId: lessonOpinion.id, ...ex } });
  }

  console.log('Lessons & Exercises seeded successfully!');
  console.log('Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
