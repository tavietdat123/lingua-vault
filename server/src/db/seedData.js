import { db } from './database.js';
import crypto from 'node:crypto';

export function seedInitialData() {
  const wordsCount = db.prepare('SELECT COUNT(*) as count FROM words').get();
  if (wordsCount.count > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding initial high-yield English learning data...');

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const sampleWords = [
    {
      word: 'resilient',
      phonetic: '/rɪˈzɪl.jənt/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn',
      meaning_en: 'Able to withstand or recover quickly from difficult conditions.',
      collocations: ['resilient economy', 'stay resilient', 'highly resilient'],
      examples: [
        'He is remarkably resilient despite facing numerous setbacks in his startup.',
        'A resilient mindset is essential for long-term career growth.'
      ],
      tags: ['Work', 'IELTS', 'Mindset'],
      level: 'B2',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    },
    {
      word: 'articulate',
      phonetic: '/ɑːˈtɪk.jə.lət/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/articulate-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc rõ ràng',
      meaning_en: 'Having or showing the ability to speak fluently and coherently.',
      collocations: ['articulate speaker', 'articulate an idea', 'clear and articulate'],
      examples: [
        'She gave a witty, entertaining, and articulate speech during the conference.',
        'An engineer must be able to articulate complex technical ideas to non-technical clients.'
      ],
      tags: ['Communication', 'Career', 'IELTS'],
      level: 'C1',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    },
    {
      word: 'leverage',
      phonetic: '/ˈlev.ər.ɪdʒ/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/leverage-us.mp3',
      part_of_speech: 'verb',
      meaning_vi: 'Tận dụng, phát huy tối đa đòn bẩy / thế mạnh',
      meaning_en: 'Use something to maximum advantage.',
      collocations: ['leverage AI tools', 'leverage resources', 'gain leverage'],
      examples: [
        'We should leverage modern AI technology to boost our team productivity.',
        'The company leveraged its brand reputation to enter new international markets.'
      ],
      tags: ['Business', 'Tech', 'Work'],
      level: 'B2',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    },
    {
      word: 'meticulous',
      phonetic: '/məˈtɪk.jə.ləs/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/meticulous-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ',
      meaning_en: 'Showing great attention to detail; very careful and precise.',
      collocations: ['meticulous planning', 'meticulous attention to detail', 'meticulous research'],
      examples: [
        'The code was reviewed with meticulous care before deploying to production.',
        'His meticulous work ethic earned him high praise from senior leadership.'
      ],
      tags: ['Work', 'Academic', 'Personality'],
      level: 'C1',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    },
    {
      word: 'take for granted',
      phonetic: '/teɪk fɔːr ˈɡrɑːn.tɪd/',
      audio_url: '',
      part_of_speech: 'phrase',
      meaning_vi: 'Xem điều gì đó là hiển nhiên (không biết trân trọng)',
      meaning_en: 'To fail to properly appreciate someone or something, especially as a result of overfamiliarity.',
      collocations: ['take things for granted', 'never take for granted'],
      examples: [
        'We often take our good health for granted until we get sick.',
        'Never take your loved ones for granted.'
      ],
      tags: ['Daily', 'Idioms', 'Speaking'],
      level: 'B2',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    },
    {
      word: 'pragmatic',
      phonetic: '/præɡˈmæt.ɪk/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/pragmatic-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Thực tế, thực dụng (chú trọng tính hiệu quả thực tế hơn lý thuyết)',
      meaning_en: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
      collocations: ['pragmatic approach', 'pragmatic solution', 'pragmatic decision'],
      examples: [
        'We need a pragmatic approach to solve this engineering bottleneck quickly.',
        'He has a very pragmatic view of product development.'
      ],
      tags: ['Work', 'Tech', 'Mindset'],
      level: 'C1',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    },
    {
      word: 'streamline',
      phonetic: '/ˈstriːm.laɪn/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/streamline-us.mp3',
      part_of_speech: 'verb',
      meaning_vi: 'Tinh giản, tối ưu hóa quy trình để đạt hiệu quả cao hơn',
      meaning_en: 'Make an organization or system more efficient and effective by employing faster or simpler working methods.',
      collocations: ['streamline the workflow', 'streamline operations', 'streamline communication'],
      examples: [
        'The new automated software helped streamline our daily deployment workflow.',
        'They are looking for ways to streamline their customer support process.'
      ],
      tags: ['Work', 'Tech', 'Business'],
      level: 'B2',
      repetition: 0,
      interval: 0,
      ease_factor: 2.5,
      due_date: today,
      status: 'new'
    }
  ];

  const insertWord = db.prepare(`
    INSERT INTO words (
      id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
      collocations, examples, tags, level, repetition, interval, ease_factor,
      due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const w of sampleWords) {
    insertWord.run(
      crypto.randomUUID(),
      w.word,
      w.phonetic,
      w.audio_url,
      w.part_of_speech,
      w.meaning_vi,
      w.meaning_en,
      JSON.stringify(w.collocations),
      JSON.stringify(w.examples),
      JSON.stringify(w.tags),
      w.level,
      w.repetition,
      w.interval,
      w.ease_factor,
      w.due_date,
      w.status,
      now,
      now
    );
  }

  // Sample Patterns
  const samplePatterns = [
    {
      name: 'It goes without saying that',
      formula: 'It goes without saying that + [Clause: S + V]',
      explanation: 'Dùng khi muốn nhấn mạnh một sự thật hiển nhiên mà ai cũng đồng tình, không cần phải bàn cãi.',
      meaning_vi: 'Hiển nhiên là..., Rõ ràng là...',
      tone: 'Formal',
      examples: [
        'It goes without saying that hard work and consistency lead to great results.',
        'It goes without saying that data security is our highest priority.'
      ],
      tags: ['Writing', 'Speaking', 'Academic']
    },
    {
      name: 'It is high time + S + V2/ed',
      formula: 'It is high time / It is about time + S + V(past simple)',
      explanation: 'Dùng để nhấn mạnh đã đến lúc phải làm điều gì đó (thậm chí là hơi trễ rồi).',
      meaning_vi: 'Đã đến lúc cần phải...',
      tone: 'Daily / Business',
      examples: [
        'It is high time we upgraded our system architecture.',
        'It is about time you started taking English learning seriously.'
      ],
      tags: ['Grammar', 'Speaking', 'Work']
    },
    {
      name: 'Not only... but also (Inversion)',
      formula: 'Not only + Aux + S + V, but S also + V',
      explanation: 'Đảo ngữ để nhấn mạnh hai đặc điểm nổi bật cùng một lúc.',
      meaning_vi: 'Không những... mà còn...',
      tone: 'Academic / Formal',
      examples: [
        'Not only did he complete the project on time, but he also exceeded all expectations.',
        'Not only is this app completely free, but it also provides top-notch performance.'
      ],
      tags: ['IELTS', 'Grammar', 'Writing']
    },
    {
      name: 'With a view to + V-ing',
      formula: 'S + V + with a view to + V-ing / Noun phrase',
      explanation: 'Dùng để diễn đạt mục đích, dự định trong tương lai một cách trang trọng.',
      meaning_vi: 'Với mục đích / nhằm mục tiêu làm gì...',
      tone: 'Formal / Email',
      examples: [
        'We implemented this personal app with a view to retaining English knowledge long-term.',
        'The team is conducting user research with a view to improving the overall experience.'
      ],
      tags: ['Writing', 'Email', 'Work']
    }
  ];

  const insertPattern = db.prepare(`
    INSERT INTO patterns (
      id, name, formula, explanation, meaning_vi, tone,
      examples, tags, repetition, interval, ease_factor,
      due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 2.5, ?, 'new', ?, ?)
  `);

  for (const p of samplePatterns) {
    insertPattern.run(
      crypto.randomUUID(),
      p.name,
      p.formula,
      p.explanation,
      p.meaning_vi,
      p.tone,
      JSON.stringify(p.examples),
      JSON.stringify(p.tags),
      today,
      now,
      now
    );
  }

  // Sample Notes
  const insertNote = db.prepare(`
    INSERT INTO notes (id, title, content, topic, tags, linked_words, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNote.run(
    crypto.randomUUID(),
    'The Secret of Consistent English Learning',
    `Language learning is not a sprint; it is a marathon. To become an articulate speaker, one must cultivate a resilient mindset.

Instead of cramming 50 words in a single night and forgetting them next week, you should leverage the power of Spaced Repetition (SRS). It goes without saying that reviewing with meticulous attention every day will build lasting neural pathways.

Never take your daily small progress for granted. Adopting a pragmatic routine will help you streamline your study sessions. Just 10 minutes a day will compound into extraordinary mastery over time.`,
    'Learning Strategy',
    JSON.stringify(['Productivity', 'Mindset', 'English Tips']),
    JSON.stringify(['resilient', 'articulate', 'leverage', 'meticulous', 'take for granted', 'pragmatic', 'streamline']),
    now,
    now
  );

  insertNote.run(
    crypto.randomUUID(),
    'Effective Email Communication in Tech',
    `When writing professional emails to international colleagues, clarity is king.

Always aim to be concise and pragmatic. With a view to keeping communication smooth, it is advisable to articulate your main points in bullet points rather than lengthy paragraphs.

It is high time teams streamlined their internal communication channels to reduce unnecessary meetings.`,
    'Business English',
    JSON.stringify(['Email', 'Work', 'Tech']),
    JSON.stringify(['articulate', 'pragmatic', 'streamline']),
    now,
    now
  );

  console.log('✅ Initial English learning data seeded successfully.');
}
