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

/**
 * Seed Specialized Data for Work & Project Management (Dự án & Công việc)
 */
export function seedWorkProjectData(force = false) {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // 1. Ensure 'work' topic exists
  const workTopic = db.prepare("SELECT id FROM topics WHERE id = 'work'").get();
  if (!workTopic) {
    db.prepare(`
      INSERT INTO topics (id, name, emoji, color, description, created_at, updated_at)
      VALUES ('work', 'Công việc & Dự án', '💼', '#0284c7', 'Từ vựng quản trị dự án, đàm phán, email và giao tiếp công sở', ?, ?)
    `).run(now, now);
  }

  // Check if already seeded work vocabulary
  const existingDeliverable = db.prepare("SELECT id FROM words WHERE word = 'deliverable'").get();
  if (existingDeliverable && !force) {
    console.log('ℹ️ Work & Project dataset is already seeded.');
    return { success: true, message: 'Work & Project data already seeded' };
  }

  console.log('🌱 Seeding high-yield Work & Project Management vocabulary & patterns...');

  const workWords = [
    {
      word: 'deliverable',
      phonetic: '/dɪˈlɪv.ər.ə.bəl/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/deliverable-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Sản phẩm / kết quả bàn giao của dự án',
      meaning_en: 'Something that can be provided as a product or output of a development process.',
      collocations: ['key deliverables', 'project deliverables', 'meet deliverables', 'deliverable timeline'],
      examples: [
        'The engineering team successfully shipped all key deliverables ahead of the sprint deadline.',
        'Comprehensive documentation is one of the mandatory deliverables for this enterprise client.'
      ],
      tags: ['Work', 'Project', 'Business'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'milestone',
      phonetic: '/ˈmaɪl.stəʊn/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/milestone-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Cột mốc quan trọng trong tiến độ dự án',
      meaning_en: 'An important event in the development or history of something or in a project timeline.',
      collocations: ['reach a milestone', 'major milestone', 'project milestone', 'critical milestone'],
      examples: [
        'Completing the mobile app architecture marks a major milestone for our entire team.',
        'We set measurable quarterly milestones to track project OKRs effectively.'
      ],
      tags: ['Project', 'Work', 'Management'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'bottleneck',
      phonetic: '/ˈbɒt.əl.nek/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/bottleneck-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Điểm nghẽn, nút thắt cổ chai gây đình trệ tiến độ',
      meaning_en: 'A point of congestion or blockage in a system that stops or slows progress.',
      collocations: ['identify the bottleneck', 'bottleneck in the workflow', 'eliminate bottlenecks', 'production bottleneck'],
      examples: [
        'Code review delays have become a major bottleneck in our deployment pipeline.',
        'We streamlined the approval process to eliminate bureaucratic bottlenecks.'
      ],
      tags: ['Tech', 'Work', 'Project'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'stakeholder',
      phonetic: '/ˈsteɪkˌhəʊl.dər/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/stakeholder-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Các bên liên quan (khách hàng, ban điều hành, đối tác dự án)',
      meaning_en: 'A person, group or organization that has interest or concern in a project or business.',
      collocations: ['key stakeholders', 'stakeholder management', 'align with stakeholders', 'stakeholder engagement'],
      examples: [
        'We scheduled a weekly briefing to keep all key stakeholders aligned on the project roadmap.',
        'Managing stakeholder expectations is crucial for every successful project manager.'
      ],
      tags: ['Business', 'Management', 'Work'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'bandwidth',
      phonetic: '/ˈbænd.wɪtθ/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/bandwidth-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Quỹ thời gian / khả năng tiếp nhận thêm công việc',
      meaning_en: 'The capacity, time, or mental energy needed to deal with a situation or workload.',
      collocations: ['have the bandwidth', 'lack the bandwidth', 'increase team bandwidth', 'mental bandwidth'],
      examples: [
        'I would love to help with the new feature, but I do not have enough bandwidth this sprint.',
        'Let us check the engineers bandwidth before committing to new client requests.'
      ],
      tags: ['Work', 'Speaking', 'Tech'],
      level: 'C1',
      topic_id: 'work'
    },
    {
      word: 'scope creep',
      phonetic: '/skəʊp kriːp/',
      audio_url: '',
      part_of_speech: 'noun',
      meaning_vi: 'Hiện tượng phình phạm vi dự án ngoài thỏa thuận ban đầu',
      meaning_en: 'The gradual adding of new features or requirements to a project beyond its original boundaries.',
      collocations: ['prevent scope creep', 'suffer from scope creep', 'manage scope creep'],
      examples: [
        'Without clear requirements, the client project quickly suffered from uncontrollable scope creep.',
        'The PM pushed back on extra feature requests to avoid scope creep and missed deadlines.'
      ],
      tags: ['Tech', 'Project', 'Management'],
      level: 'C1',
      topic_id: 'work'
    },
    {
      word: 'feasibility',
      phonetic: '/ˌfiː.zəˈbɪl.ə.ti/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/feasibility-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Tính khả thi (về mặt kỹ thuật, chi phí hoặc thời gian)',
      meaning_en: 'The state or degree of being easily or conveniently done; practical viability.',
      collocations: ['feasibility study', 'assess the feasibility', 'technical feasibility', 'economic feasibility'],
      examples: [
        'We conducted a thorough feasibility study before adopting the new AI model in production.',
        'The CTO verified the technical feasibility of the proposed offline-first database architecture.'
      ],
      tags: ['Tech', 'Business', 'Project'],
      level: 'C1',
      topic_id: 'work'
    },
    {
      word: 'contingency plan',
      phonetic: '/kənˈtɪn.dʒən.si plæn/',
      audio_url: '',
      part_of_speech: 'phrase',
      meaning_vi: 'Kế hoạch dự phòng khi có sự cố phát sinh (Phương án B)',
      meaning_en: 'A plan designed to take a possible future event or circumstance into account.',
      collocations: ['devise a contingency plan', 'have a contingency plan', 'robust contingency plan'],
      examples: [
        'Every mission-critical project must have a robust contingency plan in case of third-party API downtime.',
        'The project manager prepared a contingency plan to mitigate budget overrun.'
      ],
      tags: ['Project', 'Risk', 'Work'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'cross-functional',
      phonetic: '/ˌkrɒsˈfʌŋk.ʃən.əl/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/cross-functional-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Liên chức năng, phối hợp đa phòng ban (Engineering, Design, Product)',
      meaning_en: 'Composed of members from different functional areas within an organization.',
      collocations: ['cross-functional team', 'cross-functional collaboration', 'cross-functional alignment'],
      examples: [
        'We formed a cross-functional squad of developers, designers, and QA to ship the product.',
        'Effective cross-functional communication is vital for fast-paced tech companies.'
      ],
      tags: ['Work', 'Management', 'Career'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'actionable',
      phonetic: '/ˈæk.ʃən.ə.bəl/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/actionable-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Có thể đưa vào hành động thực tế ngay lập tức',
      meaning_en: 'Giving sufficient reason to take practical action; capable of being acted upon.',
      collocations: ['actionable feedback', 'actionable insights', 'actionable steps', 'actionable recommendations'],
      examples: [
        'The sprint retrospective meeting provided actionable feedback to improve our next release.',
        'We need actionable metrics rather than superficial vanity numbers.'
      ],
      tags: ['Work', 'Business', 'Speaking'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'delegate',
      phonetic: '/ˈdel.ɪ.ɡeɪt/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/delegate-us.mp3',
      part_of_speech: 'verb',
      meaning_vi: 'Ủy quyền, giao phó nhiệm vụ cho cấp dưới hoặc đồng đội',
      meaning_en: 'Entrust a task or responsibility to another person, typically one who is less senior than oneself.',
      collocations: ['delegate tasks', 'delegate authority', 'effective delegation', 'delegate responsibilities'],
      examples: [
        'A good tech lead knows when to delegate complex tasks to senior team members.',
        'Learning to delegate effectively prevented him from burning out.'
      ],
      tags: ['Leadership', 'Work', 'Management'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'escalate',
      phonetic: '/ˈes.kə.leɪt/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/escalate-us.mp3',
      part_of_speech: 'verb',
      meaning_vi: 'Chuyển tiếp / báo cáo vấn đề lên cấp quản lý cao hơn để can thiệp',
      meaning_en: 'Increase rapidly or make something more serious; pass a matter to a higher authority.',
      collocations: ['escalate the issue', 'escalate to management', 'escalation path', 'escalate a ticket'],
      examples: [
        'If the client does not respond by tomorrow, we will escalate the issue to the account director.',
        'Please establish a clear escalation process for critical server incidents.'
      ],
      tags: ['Work', 'Support', 'Tech'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'benchmark',
      phonetic: '/ˈbentʃ.mɑːk/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/benchmark-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Tiêu chuẩn đối sánh hiệu năng hoặc chất lượng chuẩn mực',
      meaning_en: 'A standard or point of reference against which things may be compared or assessed.',
      collocations: ['industry benchmark', 'performance benchmark', 'set a benchmark', 'benchmark tests'],
      examples: [
        'The performance benchmark shows our SQLite database responds in under 5 milliseconds.',
        'Their customer satisfaction rating has set a new industry benchmark.'
      ],
      tags: ['Tech', 'Business', 'Work'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'due diligence',
      phonetic: '/ˌdjuː ˈdɪl.ɪ.dʒəns/',
      audio_url: '',
      part_of_speech: 'noun',
      meaning_vi: 'Sự thẩm định, rà soát cẩn trọng trước khi ký kết hoặc quyết định',
      meaning_en: 'Reasonable steps taken by a person in order to satisfy a legal requirement or verify facts.',
      collocations: ['conduct due diligence', 'proper due diligence', 'due diligence process'],
      examples: [
        'We must conduct thorough due diligence before selecting the third-party cloud vendor.',
        'Due diligence revealed several potential security vulnerabilities in their legacy codebase.'
      ],
      tags: ['Business', 'Legal', 'Work'],
      level: 'C1',
      topic_id: 'work'
    },
    {
      word: 'pivot',
      phonetic: '/ˈpɪv.ət/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/pivot-us.mp3',
      part_of_speech: 'verb',
      meaning_vi: 'Chuyển hướng chiến lược nhanh chóng để đáp ứng thị trường',
      meaning_en: 'Completely change the direction of a business or product in response to feedback.',
      collocations: ['pivot the product strategy', 'make a strategic pivot', 'pivot to enterprise'],
      examples: [
        'The team decided to pivot from B2C to B2B enterprise software after extensive user interviews.',
        'When market requirements changed abruptly, the engineering team pivoted seamlessly.'
      ],
      tags: ['Business', 'Startup', 'Tech'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'synergy',
      phonetic: '/ˈsɪn.ə.dʒi/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/synergy-us.mp3',
      part_of_speech: 'noun',
      meaning_vi: 'Hiệu ứng cộng hưởng (kết hợp tạo ra sức mạnh vượt trội)',
      meaning_en: 'The interaction of multiple elements to produce a combined effect greater than the sum of separate effects.',
      collocations: ['create synergy', 'team synergy', 'positive synergy', 'cross-team synergy'],
      examples: [
        'The close synergy between software engineers and product designers accelerated our release cycle.',
        'We aim to create operational synergies across the development and marketing departments.'
      ],
      tags: ['Management', 'Work', 'Business'],
      level: 'C1',
      topic_id: 'work'
    },
    {
      word: 'prioritize',
      phonetic: '/praɪˈɒr.ɪ.taɪz/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/prioritize-us.mp3',
      part_of_speech: 'verb',
      meaning_vi: 'Ưu tiên, sắp xếp thứ tự ưu tiên xử lý',
      meaning_en: 'Determine the order for dealing with a series of items or tasks according to relative importance.',
      collocations: ['prioritize backlog items', 'prioritize ruthlessly', 'prioritize user security'],
      examples: [
        'During sprint planning, the product owner prioritizes user stories based on business impact.',
        'We need to prioritize critical bug fixes over new experimental features.'
      ],
      tags: ['Work', 'Management', 'Agile'],
      level: 'B2',
      topic_id: 'work'
    },
    {
      word: 'iterative',
      phonetic: '/ˈɪt.ər.ə.tɪv/',
      audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/iterative-us.mp3',
      part_of_speech: 'adjective',
      meaning_vi: 'Lặp đi lặp lại có cải tiến (quy trình lặp từng giai đoạn)',
      meaning_en: 'Relating to that involves repeating a process with the aim of approaching a desired goal.',
      collocations: ['iterative development', 'iterative approach', 'iterative testing', 'iterative cycle'],
      examples: [
        'Agile relies on an iterative development cycle with continuous user feedback.',
        'We improved the mobile user interface through multiple iterative test sessions.'
      ],
      tags: ['Agile', 'Tech', 'Work'],
      level: 'B2',
      topic_id: 'work'
    }
  ];

  const insertWord = db.prepare(`
    INSERT INTO words (
      id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
      collocations, examples, tags, level, topic_id, repetition, interval, ease_factor,
      due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const w of workWords) {
    const exists = db.prepare('SELECT id FROM words WHERE word = ?').get(w.word);
    if (!exists) {
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
        w.topic_id || 'work',
        0,
        0,
        2.5,
        today,
        'new',
        now,
        now
      );
    }
  }

  // 2. Insert Sentence Patterns for Work & Projects
  const workPatterns = [
    {
      name: "Let's circle back to",
      formula: "Let's circle back to + [Noun phrase / Topic] + later / next week",
      explanation: 'Dùng khi muốn tạm hoãn thảo luận một chủ đề để quay lại giải quyết sau khi đã có thêm dữ liệu hoặc thời gian.',
      meaning_vi: 'Hãy quay lại thảo luận vấn đề này sau...',
      tone: 'Business / Meeting',
      examples: [
        "Let's circle back to the budget allocation after we finalize the technical specs.",
        "Let's circle back to this discussion in our daily standup tomorrow."
      ],
      tags: ['Meeting', 'Work', 'Speaking']
    },
    {
      name: 'To touch base on',
      formula: 'I just wanted to touch base on + [Topic / Project name]',
      explanation: 'Dùng trong email hoặc trao đổi công việc ngắn để cập nhật nhanh tình hình tiến độ dự án.',
      meaning_vi: 'Trao đổi ngắn / cập nhật nhanh tình hình về...',
      tone: 'Email / Casual Work',
      examples: [
        'I just wanted to touch base on the client deliverable timeline.',
        "Let's schedule a 10-minute call to touch base on the sprint goals."
      ],
      tags: ['Email', 'Speaking', 'Work']
    },
    {
      name: 'Could we align on',
      formula: 'Could we align on + [Subject / Strategy / Action plan]?',
      explanation: 'Dùng trong cuộc họp khi muốn toàn đội hoặc các bên liên quan cùng đồng thuận một hướng đi chung.',
      meaning_vi: 'Chúng ta có thể thống nhất chung quan điểm về... không?',
      tone: 'Business / Meeting',
      examples: [
        'Could we align on the deployment schedule before we send the announcement?',
        'I would like to make sure we align on the project scope and key milestones.'
      ],
      tags: ['Meeting', 'Work', 'Leadership']
    },
    {
      name: 'In terms of deliverables,',
      formula: 'In terms of + [Deliverables / Timeline / Architecture], + S + V',
      explanation: 'Dùng để chuyển ý và tập trung báo cáo cụ thể về các hạng mục bàn giao trong dự án.',
      meaning_vi: 'Xét về mặt sản phẩm bàn giao / tiến độ thì...',
      tone: 'Formal / Presentation',
      examples: [
        'In terms of deliverables, the backend team has already finished 95% of the core APIs.',
        'In terms of timeline, we are well on track for the official Q3 release.'
      ],
      tags: ['Presentation', 'Project', 'Work']
    },
    {
      name: 'It is imperative that we',
      formula: 'It is imperative that + S + (should) + V-inf',
      explanation: 'Cấu trúc giả định thức cao cấp dùng để nhấn mạnh một nhiệm vụ mang tính sống còn, cấp bách trong công việc.',
      meaning_vi: 'Điều tối quan trọng / cấp thiết là chúng ta phải...',
      tone: 'Formal / Executive',
      examples: [
        'It is imperative that we conduct comprehensive security audits before launch.',
        'It is imperative that all cross-functional team members align on data privacy policies.'
      ],
      tags: ['Leadership', 'Formal', 'Work']
    },
    {
      name: 'From a strategic standpoint,',
      formula: 'From a strategic / technical standpoint, + S + V',
      explanation: 'Dùng khi đưa ra góc nhìn phân tích chuyên môn cao cấp trong các buổi thuyết trình hoặc đàm phán.',
      meaning_vi: 'Xét từ góc độ chiến lược / chuyên môn kỹ thuật...',
      tone: 'Executive / Strategic',
      examples: [
        'From a strategic standpoint, expanding into mobile apps will double our daily active learners.',
        'From a technical standpoint, SQLite provides unmatched zero-latency performance for desktop and mobile.'
      ],
      tags: ['Strategy', 'Work', 'Management']
    },
    {
      name: 'With all due respect, I propose that',
      formula: 'With all due respect, I propose that + [Clause]',
      explanation: 'Dùng để phản biện một cách lịch sự, chuyên nghiệp và đầy tính ngoại giao trong môi trường doanh nghiệp.',
      meaning_vi: 'Với tất cả sự tôn trọng (khi phản biện), tôi đề xuất rằng...',
      tone: 'Diplomatic / Negotiation',
      examples: [
        'With all due respect, I propose that we delay the release by one week to resolve critical bottlenecks.',
        'With all due respect, our current server capacity cannot sustain that sudden spike in traffic.'
      ],
      tags: ['Negotiation', 'Meeting', 'Diplomatic']
    }
  ];

  const insertPattern = db.prepare(`
    INSERT INTO patterns (
      id, name, formula, explanation, meaning_vi, tone,
      examples, tags, repetition, interval, ease_factor,
      due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 2.5, ?, 'new', ?, ?)
  `);

  for (const p of workPatterns) {
    const exists = db.prepare('SELECT id FROM patterns WHERE name = ?').get(p.name);
    if (!exists) {
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
  }

  // 3. Insert Smart Reader Notes for Work & Project Management
  const insertNote = db.prepare(`
    INSERT INTO notes (id, title, content, topic, tags, linked_words, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const workNotes = [
    {
      title: 'Mastering Agile Sprint Delivery & Stakeholder Alignment',
      topic: 'work',
      tags: ['Agile', 'Project', 'Leadership'],
      linked_words: ['deliverable', 'milestone', 'bottleneck', 'stakeholder', 'bandwidth', 'scope creep', 'feasibility', 'cross-functional', 'actionable', 'prioritize', 'iterative'],
      content: `Delivering high-stakes software projects requires more than just clean code; it demands seamless stakeholder management and disciplined execution.

In modern agile development, teams work in iterative cycles to deliver measurable milestones. Before committing to a sprint, the team must evaluate their actual bandwidth and conduct technical feasibility studies.

It goes without saying that uncontrolled scope creep is the number one cause of project failure. When clients request additional features midway through a sprint, experienced tech leads know how to prioritize ruthlessly and communicate transparently.

To prevent bottlenecks from stalling deployment, engineers should leverage automated CI/CD pipelines. It is imperative that we establish clear escalation procedures and maintain actionable feedback loops across cross-functional teams.`
    },
    {
      title: 'Handling Project Bottlenecks & Risk Mitigation',
      topic: 'work',
      tags: ['Risk', 'Work', 'Management'],
      linked_words: ['bottleneck', 'contingency plan', 'due diligence', 'pivot', 'synergy', 'delegate', 'escalate', 'benchmark', 'streamline', 'leverage'],
      content: `Every complex enterprise project will inevitably encounter unexpected obstacles. The true hallmark of effective leadership is how rapidly a team can pivot and mitigate risks.

When a critical bottleneck arises, the first step is to identify the root cause through due diligence rather than assigning blame. Could we align on realistic solutions and create a contingency plan before escalating to senior executives?

By delegating tasks effectively and fostering strong team synergy, organizations can streamline their workflows and establish new industry benchmarks. Remember, clear communication and timely alignment are your most powerful project assets.`
    }
  ];

  for (const n of workNotes) {
    const exists = db.prepare('SELECT id FROM notes WHERE title = ?').get(n.title);
    if (!exists) {
      insertNote.run(
        crypto.randomUUID(),
        n.title,
        n.content,
        n.topic,
        JSON.stringify(n.tags),
        JSON.stringify(n.linked_words),
        now,
        now
      );
    }
  }

  console.log('✅ Successfully seeded Work & Project Management vocabulary, patterns, and reader notes.');
  return { success: true, message: 'Seeded Work & Project Management data successfully!' };
}
