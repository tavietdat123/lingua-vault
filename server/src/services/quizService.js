import { getDb } from '../db/database.js';
import { gamificationService } from './gamificationService.js';

// Helper to resolve single or multiple topics
export function resolveTopics(db, topicInput) {
  let list = [];
  if (Array.isArray(topicInput)) {
    list = topicInput;
  } else if (typeof topicInput === 'string') {
    list = topicInput.split(',').map(s => s.trim()).filter(Boolean);
  }

  const isAll = list.length === 0 || list.some(t => t.toLowerCase() === 'all');
  if (isAll) {
    return { isAll: true, targetIds: [], displayNames: ['Tất cả (All)'] };
  }

  let masterTopics = [];
  try {
    masterTopics = db.prepare('SELECT * FROM topics').all();
  } catch (e) {
    masterTopics = [];
  }

  const targetIds = [];
  const displayNames = [];

  list.forEach(item => {
    const matched = masterTopics.find(mt => 
      mt.id.toLowerCase() === item.toLowerCase() || 
      mt.name.toLowerCase() === item.toLowerCase()
    );
    if (matched) {
      if (!targetIds.includes(matched.id.toLowerCase())) {
        targetIds.push(matched.id.toLowerCase());
        displayNames.push(`${matched.emoji || '🏷️'} ${matched.name}`);
      }
    } else {
      if (!targetIds.includes(item.toLowerCase())) {
        targetIds.push(item.toLowerCase());
        displayNames.push(item);
      }
    }
  });

  return {
    isAll: false,
    targetIds,
    displayNames
  };
}

// Helper to filter items by Date Scope (Single date, Array of dates, or Date range)
export function filterItemsByDate(items, dateScope = 'all', specificDate = null, startDate = null, endDate = null) {
  if (!items || items.length === 0) return [];
  if (!dateScope || dateScope === 'all') return items;

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);
  const d7Str = d7.toISOString().substring(0, 10);

  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);
  const d30Str = d30.toISOString().substring(0, 10);

  if (dateScope === 'today') {
    return items.filter(i => (i.created_at || '').substring(0, 10) === todayStr);
  }
  if (dateScope === 'yesterday') {
    return items.filter(i => (i.created_at || '').substring(0, 10) === yesterdayStr);
  }
  if (dateScope === 'last_7_days') {
    return items.filter(i => (i.created_at || '').substring(0, 10) >= d7Str);
  }
  if (dateScope === 'last_30_days') {
    return items.filter(i => (i.created_at || '').substring(0, 10) >= d30Str);
  }
  if (dateScope === 'range' && (startDate || endDate)) {
    return items.filter(i => {
      const d = (i.created_at || '').substring(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }
  if (dateScope === 'custom' || dateScope === 'specific' || Array.isArray(specificDate) || (typeof specificDate === 'string' && specificDate.length > 0)) {
    const datesArray = Array.isArray(specificDate) 
      ? specificDate.filter(Boolean)
      : (specificDate && specificDate.includes(',') ? specificDate.split(',').map(s => s.trim()).filter(Boolean) : (specificDate ? [specificDate] : []));
    if (datesArray.length > 0) {
      return items.filter(i => datesArray.includes((i.created_at || '').substring(0, 10)));
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateScope)) {
    return items.filter(i => (i.created_at || '').substring(0, 10) === dateScope);
  }

  return items;
}

const EASY_DISTRACTORS = [
  { word: 'apple', meaning_vi: 'Quả táo (trái cây ăn ngọt)' },
  { word: 'morning', meaning_vi: 'Buổi sáng sớm tinh mơ' },
  { word: 'water', meaning_vi: 'Nước uống giải khát hàng ngày' },
  { word: 'house', meaning_vi: 'Ngôi nhà để ở' },
  { word: 'run', meaning_vi: 'Chạy nhanh bằng hai chân' },
  { word: 'book', meaning_vi: 'Quyển sách để đọc giải trí' },
  { word: 'music', meaning_vi: 'Âm nhạc và giai điệu bài hát' },
  { word: 'sunshine', meaning_vi: 'Ánh nắng mặt trời ấm áp' }
];

export const IRREGULAR_VERBS = {
  be: { s: 'is', past: 'was', pp: 'been', ing: 'being' },
  have: { s: 'has', past: 'had', pp: 'had', ing: 'having' },
  do: { s: 'does', past: 'did', pp: 'done', ing: 'doing' },
  go: { s: 'goes', past: 'went', pp: 'gone', ing: 'going' },
  make: { s: 'makes', past: 'made', pp: 'made', ing: 'making' },
  take: { s: 'takes', past: 'took', pp: 'taken', ing: 'taking' },
  give: { s: 'gives', past: 'gave', pp: 'given', ing: 'giving' },
  lead: { s: 'leads', past: 'led', pp: 'led', ing: 'leading' },
  build: { s: 'builds', past: 'built', pp: 'built', ing: 'building' },
  understand: { s: 'understands', past: 'understood', pp: 'understood', ing: 'understanding' },
  choose: { s: 'chooses', past: 'chose', pp: 'chosen', ing: 'choosing' },
  speak: { s: 'speaks', past: 'spoke', pp: 'spoken', ing: 'speaking' },
  find: { s: 'finds', past: 'found', pp: 'found', ing: 'finding' },
  bring: { s: 'brings', past: 'brought', pp: 'brought', ing: 'bringing' },
  keep: { s: 'keeps', past: 'kept', pp: 'kept', ing: 'keeping' },
  set: { s: 'sets', past: 'set', pp: 'set', ing: 'setting' },
  think: { s: 'thinks', past: 'thought', pp: 'thought', ing: 'thinking' },
  seek: { s: 'seeks', past: 'sought', pp: 'sought', ing: 'seeking' },
  run: { s: 'runs', past: 'ran', pp: 'run', ing: 'running' },
  become: { s: 'becomes', past: 'became', pp: 'become', ing: 'becoming' },
  begin: { s: 'begins', past: 'began', pp: 'begun', ing: 'beginning' }
};

export const IRREGULAR_NOUNS = {
  criterion: 'criteria',
  analysis: 'analyses',
  hypothesis: 'hypotheses',
  thesis: 'theses',
  phenomenon: 'phenomena',
  datum: 'data',
  person: 'people',
  child: 'children',
  man: 'men',
  woman: 'women'
};

export function inflectEnglishWord(word, partOfSpeech = '') {
  const raw = (word || '').toLowerCase().trim();
  const parts = raw.split(/\s+/);
  const mainWord = parts[0];
  const rest = parts.slice(1).join(' ');
  const suffix = rest ? ' ' + rest : '';

  const irregularV = IRREGULAR_VERBS[mainWord];
  const irregularN = IRREGULAR_NOUNS[mainWord];

  // 1. Third-person singular (-s / -es / -ies)
  let sForm = '';
  if (irregularV) {
    sForm = irregularV.s + suffix;
  } else if (/(?:s|sh|ch|x|z|o)$/.test(mainWord)) {
    sForm = mainWord + 'es' + suffix;
  } else if (/[^aeiou]y$/.test(mainWord)) {
    sForm = mainWord.slice(0, -1) + 'ies' + suffix;
  } else {
    sForm = mainWord + 's' + suffix;
  }

  // 2. Past tense & past participle (-ed / -d / -ied / irregular)
  let edForm = '';
  if (irregularV) {
    edForm = irregularV.past + suffix;
  } else if (mainWord.endsWith('e')) {
    edForm = mainWord + 'd' + suffix;
  } else if (/[^aeiou]y$/.test(mainWord)) {
    edForm = mainWord.slice(0, -1) + 'ied' + suffix;
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(mainWord) && mainWord.length <= 5) {
    edForm = mainWord + mainWord.slice(-1) + 'ed' + suffix;
  } else {
    edForm = mainWord + 'ed' + suffix;
  }

  // 3. Gerund / Present participle (-ing)
  let ingForm = '';
  if (irregularV) {
    ingForm = irregularV.ing + suffix;
  } else if (mainWord.endsWith('ie')) {
    ingForm = mainWord.slice(0, -2) + 'ying' + suffix;
  } else if (mainWord.endsWith('e') && !mainWord.endsWith('ee')) {
    ingForm = mainWord.slice(0, -1) + 'ing' + suffix;
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(mainWord) && mainWord.length <= 5) {
    ingForm = mainWord + mainWord.slice(-1) + 'ing' + suffix;
  } else {
    ingForm = mainWord + 'ing' + suffix;
  }

  // 4. Plural form for nouns (e.g. 'contingency plan' -> 'contingency plans', 'scope creep' -> 'scope creeps')
  let plural = '';
  if (parts.length > 1 && (partOfSpeech.includes('noun') || !partOfSpeech.includes('verb'))) {
    const lastWord = parts[parts.length - 1];
    const irregularLastN = IRREGULAR_NOUNS[lastWord];
    let lastPlural = irregularLastN || (/(?:s|sh|ch|x|z)$/.test(lastWord) ? lastWord + 'es' : (/[^aeiou]y$/.test(lastWord) ? lastWord.slice(0, -1) + 'ies' : lastWord + 's'));
    plural = [...parts.slice(0, -1), lastPlural].join(' ');
  } else {
    plural = irregularN ? irregularN + suffix : sForm;
  }

  // 5. Adverb form for adjectives
  let advForm = '';
  if (mainWord.endsWith('ic')) {
    advForm = mainWord + 'ally' + suffix;
  } else if (mainWord.endsWith('le')) {
    advForm = mainWord.slice(0, -1) + 'y' + suffix;
  } else if (mainWord.endsWith('y')) {
    advForm = mainWord.slice(0, -1) + 'ily' + suffix;
  } else if (!mainWord.endsWith('ly')) {
    advForm = mainWord + 'ly' + suffix;
  }

  return {
    base: raw,
    sForm,
    edForm,
    ingForm,
    plural,
    advForm
  };
}

export function generateGrammarClozeQuestion({
  targetWord,
  validTargetMeaning,
  examples = [],
  qDifficulty = 'medium',
  questionIndex = 0,
  otherWords = []
}) {
  const pos = (targetWord.part_of_speech || '').toLowerCase();
  const forms = inflectEnglishWord(targetWord.word, pos);
  const isVerb = pos.includes('verb') || ['avoid', 'delegate', 'leverage', 'implement', 'facilitate', 'mitigate', 'articulate', 'pivot', 'escalate', 'reach', 'prioritize', 'benchmark'].includes(targetWord.word.toLowerCase());
  const isNoun = pos.includes('noun') || ['milestone', 'deliverable', 'constraint', 'strategy', 'criterion', 'analysis', 'contingency plan', 'bandwidth', 'bottleneck', 'priority'].includes(targetWord.word.toLowerCase());
  const isAdj = pos.includes('adj') || ['resilient', 'meticulous', 'articulate', 'eloquent', 'ubiquitous', 'innovative', 'adaptable'].includes(targetWord.word.toLowerCase());

  let questionText = '';
  let promptSubtitle = '';
  let correctAnswer = targetWord.word;
  let explanation = '';
  let grammarOptions = [];

  if (isVerb) {
    // === CHẾ ĐỘ ĐỘNG TỪ (VERB): Luân phiên 3rd person -s/-es, Quá khứ -ed, và Danh động từ V-ing ===
    const verbCycle = questionIndex % 3;

    if (verbCycle === 0) {
      // 1. Hiện tại đơn ngôi thứ 3 số ít (+s / +es)
      correctAnswer = forms.sForm;
      const templates = [
        `She consistently _______ taking unnecessary risks during high-stakes project phases.`,
        `Our lead architect effectively _______ key responsibilities across the engineering squads.`,
        `The product owner regularly _______ available analytics to guide strategic roadmap decisions.`,
        `Every senior specialist carefully _______ each implementation detail prior to release.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = qDifficulty === 'easy'
        ? `Chia động từ ở thì Hiện tại đơn - Ngôi thứ 3 số ít "She / He / Lead" (${validTargetMeaning} - Thêm -s/-es):`
        : (qDifficulty === 'hard'
          ? `Phân tích chủ ngữ ngôi thứ 3 số ít và ngữ pháp thì hiện tại đơn để chọn dạng động từ chính xác:`
          : `Chia động từ ở thì Hiện tại đơn (Chủ ngữ ngôi thứ 3 số ít "She / Lead" + V-s/es):`);
      explanation = `Chủ ngữ "She / Our lead / Every specialist" là ngôi thứ 3 số ít ở thì Hiện tại đơn, do đó động từ bắt buộc phải thêm đuôi "-s/-es" ➔ Đáp án chính xác là "${correctAnswer}".`;
      grammarOptions = [forms.sForm, forms.base, forms.ingForm, forms.edForm];
    } else if (verbCycle === 1) {
      // 2. Quá khứ đơn (-ed / V2)
      correctAnswer = forms.edForm;
      const templates = [
        `Last quarter, our engineering division successfully _______ all critical bottlenecks before launch.`,
        `During yesterday's retrospective, she _______ her architectural decisions with precision.`,
        `In the previous sprint, the core infrastructure team _______ all major performance hurdles.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = qDifficulty === 'easy'
        ? `Chia động từ ở thì Quá khứ đơn ("Last quarter / Yesterday" - ${validTargetMeaning}):`
        : `Chia động từ ở thì Quá khứ đơn (Dấu hiệu "Last quarter / Yesterday"):`;
      explanation = `Trạng ngữ chỉ thời gian trong quá khứ ("Last quarter / Yesterday") đòi hỏi động từ chia ở thì Quá khứ đơn (V-ed / V2) ➔ Đáp án chính xác là "${correctAnswer}".`;
      grammarOptions = [forms.edForm, forms.base, forms.sForm, forms.ingForm];
    } else {
      // 3. Danh động từ sau giới từ (V-ing)
      correctAnswer = forms.ingForm;
      const templates = [
        `The organization achieved high stability by _______ common operational oversights early.`,
        `He greatly accelerated delivery by _______ routine administrative chores across members.`,
        `After _______ the initial hurdles, the development squad reached peak productivity.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = qDifficulty === 'easy'
        ? `Chọn dạng danh động từ thích hợp sau giới từ "By / After" (${validTargetMeaning}):`
        : `Chọn dạng từ thích hợp đứng sau giới từ ("By / After / Without" + V-ing):`;
      explanation = `Đứng sau các giới từ như "By", "After", "Without", động từ phải ở dạng danh động từ (Gerund V-ing) ➔ Đáp án chính xác là "${correctAnswer}".`;
      grammarOptions = [forms.ingForm, forms.base, forms.sForm, forms.edForm];
    }
  } else if (isNoun) {
    // === CHẾ ĐỘ DANH TỪ (NOUN): Luân phiên Danh từ số nhiều (-s/-es) và Danh từ số ít ===
    const nounCycle = questionIndex % 2;

    if (nounCycle === 0) {
      // 1. Danh từ số nhiều (-s / -es)
      correctAnswer = forms.plural;
      const templates = [
        `The steering committee evaluated all project _______ before granting release approval.`,
        `There are multiple strategic _______ that the team must achieve by the end of this sprint.`,
        `Several critical _______ were delivered on time despite severe deadline pressure.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = qDifficulty === 'easy'
        ? `Chọn dạng danh từ số nhiều thích hợp ("all / multiple / several" - ${validTargetMeaning}):`
        : `Chọn dạng danh từ số nhiều thích hợp sau lượng từ ("all / multiple / several"):`;
      explanation = `Các từ chỉ số lượng ("all / multiple / several") đòi hỏi danh từ đếm được phải ở dạng số nhiều (-s/-es) ➔ Đáp án chính xác là "${correctAnswer}".`;
      grammarOptions = [forms.plural, forms.base, forms.base + "'s", forms.ingForm || forms.base + 'ing'];
    } else {
      // 2. Danh từ số ít
      correctAnswer = forms.base;
      const templates = [
        `Achieving this core objective represents a major _______ for the entire engineering department.`,
        `The architect identified an unexpected _______ in the third-party payment integration.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = `Điền danh từ thích hợp vào chỗ trống trong câu (sau mạo từ "a / an"):`;
      explanation = `Vị trí sau mạo từ "a / an" đòi hỏi danh từ đếm được ở dạng số ít ➔ Đáp án chính xác là "${correctAnswer}".`;
      grammarOptions = [forms.base, forms.plural, forms.base + "'s", forms.ingForm || forms.base + 'ing'];
    }
  } else if (isAdj) {
    // === CHẾ ĐỘ TÍNH TỪ (ADJECTIVE): Luân phiên Tính từ và Trạng từ (-ly) ===
    const adjCycle = questionIndex % 2;

    if (adjCycle === 0) {
      // 1. Tính từ bổ nghĩa cho danh từ hoặc sau to be
      correctAnswer = targetWord.word;
      const templates = [
        `The engineering team demonstrated a remarkably _______ approach to resolving system outages.`,
        `Our senior leaders are exceptionally _______ in their strategic market planning.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = qDifficulty === 'easy'
        ? `Chọn tính từ thích hợp bổ nghĩa cho danh từ (${validTargetMeaning}):`
        : `Chọn tính từ phù hợp với ngữ cảnh câu:`;
      explanation = `Vị trí trước danh từ hoặc đứng sau trạng từ đòi hỏi một tính từ (Adjective) để bổ nghĩa ➔ "${correctAnswer}".`;
      const tricky = generateTrickyWordFamily(targetWord.word);
      grammarOptions = [targetWord.word, forms.advForm || (targetWord.word + 'ly'), ...tricky].slice(0, 4);
    } else {
      // 2. Trạng từ (-ly) bổ nghĩa cho động từ
      correctAnswer = forms.advForm || (targetWord.word + 'ly');
      const templates = [
        `The senior architects worked _______ to eliminate all critical security bottlenecks.`,
        `The keynote speaker presented the technical findings _______ to the entire audience.`
      ];
      questionText = templates[questionIndex % templates.length];
      promptSubtitle = `Chọn trạng từ thích hợp bổ nghĩa cho động từ hành động ("worked / presented _______"):`;
      explanation = `Vị trí bổ nghĩa cho động từ hành động đòi hỏi một trạng từ (Adverb -ly) ➔ Đáp án chính xác là "${correctAnswer}".`;
      const tricky = generateTrickyWordFamily(targetWord.word);
      grammarOptions = [correctAnswer, targetWord.word, ...tricky].slice(0, 4);
    }
  } else {
    // === CÁC TỪ LOẠI KHÁC (Phrase / Idiom / Adverb) ===
    correctAnswer = targetWord.word;
    questionText = `In modern business environments, it is crucial to _______ to achieve maximum productivity.`;
    promptSubtitle = `Điền từ vựng thích hợp vào ngữ cảnh câu:`;
    explanation = `Điền từ "${targetWord.word}" (${validTargetMeaning}) để hoàn chỉnh câu chuẩn xác.`;
    grammarOptions = [targetWord.word, forms.sForm, forms.edForm, forms.ingForm];
  }

  // Phương án trắc nghiệm (Options)
  let options = [];
  if (qDifficulty === 'easy') {
    const easyPool = EASY_DISTRACTORS.filter(ed => ed.word !== targetWord.word.toLowerCase()).sort(() => 0.5 - Math.random());
    options = [correctAnswer, ...easyPool.slice(0, 3).map(e => e.word)];
  } else if (qDifficulty === 'hard') {
    const trickyForms = [
      ...grammarOptions.filter(g => g && g.toLowerCase() !== correctAnswer.toLowerCase()),
      ...generateTrickyWordFamily(targetWord.word),
      ...otherWords.map(w => w.word)
    ].filter(f => f && f.toLowerCase() !== correctAnswer.toLowerCase());
    options = [correctAnswer, ...trickyForms.slice(0, 3)];
  } else {
    options = grammarOptions.filter(Boolean);
    while (options.length < 4) {
      const extra = otherWords.find(w => !options.includes(w.word));
      if (extra) options.push(extra.word);
      else break;
    }
  }

  options = [...new Set(options)].sort(() => 0.5 - Math.random());

  return {
    questionText,
    promptSubtitle,
    correctAnswer,
    options,
    explanation
  };
}

export function generateTrickyWordFamily(word) {
  const w = (word || '').toLowerCase().trim();
  const forms = new Set();
  if (w.endsWith('tion')) {
    forms.add(w.slice(0, -4) + 'te');
    forms.add(w.slice(0, -4) + 'tive');
    forms.add(w.slice(0, -4) + 'tively');
  } else if (w.endsWith('able') || w.endsWith('ible')) {
    forms.add(w.slice(0, -4) + 'ability');
    forms.add(w.slice(0, -4) + 'ably');
  } else if (w.endsWith('ent')) {
    forms.add(w.slice(0, -3) + 'ence');
    forms.add(w.slice(0, -3) + 'ently');
  } else if (w.endsWith('ant')) {
    forms.add(w.slice(0, -3) + 'ance');
    forms.add(w.slice(0, -3) + 'antly');
  } else if (w.endsWith('ly')) {
    forms.add(w.slice(0, -2));
  } else if (w.endsWith('ive')) {
    forms.add(w.slice(0, -3) + 'ion');
    forms.add(w.slice(0, -3) + 'ively');
  } else {
    forms.add(w + 'ing');
    forms.add(w + 'ed');
    forms.add(w + 'ment');
    forms.add(w + 'ness');
    forms.add(w + 'ly');
  }
  return [...forms].filter(f => f !== w && f.length > 2);
}

const HIGH_QUALITY_DISTRACTORS = [
  { word: 'resilient', meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh' },
  { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc rõ ràng' },
  { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ' },
  { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa lợi thế / thế mạnh' },
  { word: 'innovative', meaning_vi: 'Đổi mới, có tính sáng tạo và đột phá' },
  { word: 'adaptable', meaning_vi: 'Thích ứng linh hoạt với mọi hoàn cảnh' },
  { word: 'proactive', meaning_vi: 'Chủ động tiên phong trong công việc' },
  { word: 'ubiquitous', meaning_vi: 'Phổ biến, có mặt ở khắp mọi nơi' },
  { word: 'sustainable', meaning_vi: 'Bền vững, có khả năng duy trì lâu dài' },
  { word: 'comprehensive', meaning_vi: 'Toàn diện, bao quát mọi khía cạnh' },
  { word: 'pragmatic', meaning_vi: 'Thực tế, coi trọng tính hiệu quả ứng dụng' },
  { word: 'collaborative', meaning_vi: 'Có tinh thần hợp tác, làm việc nhóm' }
];

const CORE_VOCABULARY_DICTIONARY = {
  love: 'Tình cảm yêu thương, sự yêu mến gắn bó sâu sắc',
  pain: 'Nỗi đau đớn, sự tổn thương về thể xác hoặc tinh thần',
  hope: 'Niềm hy vọng, sự trông đợi vào điều tốt đẹp',
  life: 'Cuộc sống, sự sinh tồn và trải nghiệm nhân sinh',
  work: 'Công việc, nhiệm vụ hoặc hoạt động lao động',
  time: 'Thời gian, khoảnh khắc diễn ra sự việc',
  dream: 'Ước mơ, hoài bão hoặc giấc chiêm bao',
  peace: 'Sự bình yên, hòa bình và thanh thản trong tâm hồn',
  focus: 'Sự tập trung, chú ý cao độ vào mục tiêu',
  habit: 'Thói quen, hành vi lặp đi lặp lại thường nhật',
  truth: 'Sự thật, chân lý khách quan',
  courage: 'Lòng dũng cảm, sự can đảm đối mặt thử thách',
  freedom: 'Sự tự do, quyền tự quyết không bị ràng buộc',
  wisdom: 'Sự thông thái, trí tuệ và hiểu biết sâu rộng'
};

const cleanMeaningText = (meaningVi, meaningEn, word) => {
  const wKey = (word || '').toLowerCase().trim();
  if (CORE_VOCABULARY_DICTIONARY[wKey]) {
    return CORE_VOCABULARY_DICTIONARY[wKey];
  }
  if (!meaningVi || typeof meaningVi !== 'string' || meaningVi.includes('Tra cứu thêm')) {
    if (meaningEn && typeof meaningEn === 'string' && !meaningEn.includes('Definition and') && !meaningEn.includes('Definition of')) {
      return meaningEn.trim();
    }
    const found = HIGH_QUALITY_DISTRACTORS.find(d => d.word.toLowerCase() === wKey);
    if (found) return found.meaning_vi;
    return 'Khái niệm, trạng thái hoặc hành động này';
  }
  return meaningVi.trim();
};

export const quizService = {
  // 1. Get all available topics / tags with counts from master data topics table for specific user
  getTopics: (userId = 'admin_master_user_id') => {
    const db = getDb();
    const allWords = db.prepare(`
      SELECT id, word, topic_id, tags, level FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);
    const totalWords = allWords.length;

    let masterTopics = [];
    try {
      masterTopics = db.prepare('SELECT * FROM topics ORDER BY created_at ASC').all();
    } catch (e) {
      masterTopics = [];
    }

    const topicItems = [
      {
        id: 'All',
        name: 'Tất cả (All)',
        emoji: '📚',
        color: '#6366f1',
        count: totalWords
      }
    ];

    masterTopics.forEach(t => {
      const matchedWords = allWords.filter(w => {
        return w.topic_id && (w.topic_id.toLowerCase() === t.id.toLowerCase() || w.topic_id.toLowerCase() === t.name.toLowerCase());
      });

      topicItems.push({
        id: t.id,
        name: t.name,
        emoji: t.emoji || '📁',
        color: t.color || '#0284c7',
        description: t.description || '',
        count: matchedWords.length
      });
    });

    return topicItems;
  },

  // 1b. Get all available dates with counts of words and patterns created on each day
  getDates: (userId = 'admin_master_user_id') => {
    const db = getDb();
    const wordDates = db.prepare(`
      SELECT substr(created_at, 1, 10) as date, count(*) as count
      FROM words
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        AND created_at IS NOT NULL
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date DESC
    `).all(userId, userId, userId);

    const patternDates = db.prepare(`
      SELECT substr(created_at, 1, 10) as date, count(*) as count
      FROM patterns
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        AND created_at IS NOT NULL
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date DESC
    `).all(userId, userId, userId);

    const dateMap = new Map();
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    wordDates.forEach(r => {
      if (!r.date) return;
      const existing = dateMap.get(r.date) || { date: r.date, words_count: 0, patterns_count: 0, total_count: 0 };
      existing.words_count += r.count;
      existing.total_count += r.count;
      dateMap.set(r.date, existing);
    });

    patternDates.forEach(r => {
      if (!r.date) return;
      const existing = dateMap.get(r.date) || { date: r.date, words_count: 0, patterns_count: 0, total_count: 0 };
      existing.patterns_count += r.count;
      existing.total_count += r.count;
      dateMap.set(r.date, existing);
    });

    const sortedDates = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    return sortedDates.map(item => {
      let label = item.date;
      try {
        const [y, m, d] = item.date.split('-');
        label = `${d}/${m}/${y}`;
      } catch (e) {}

      if (item.date === todayStr) {
        label = `Hôm nay (${label})`;
      } else if (item.date === yesterdayStr) {
        label = `Hôm qua (${label})`;
      }

      return {
        ...item,
        label
      };
    });
  },

  // 2. Generate a Quiz based on Topics, Date Scope, Count and IELTS Level
  generateQuiz: ({ topic = 'All', count = 5, mode = 'mixed', level = 'all', date_scope = 'all', date = null, start_date = null, end_date = null, userId = 'admin_master_user_id' }) => {
    const db = getDb();
    let words = db.prepare(`
      SELECT * FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    if (words.length === 0) {
      throw new Error('Kho từ vựng đang trống. Vui lòng thêm từ vựng trước khi tạo bài Quiz!');
    }

    const targetCount = Math.max(1, parseInt(count, 10) || 5);

    // 1. Filter by Date Scope if specified
    let candidateWords = filterItemsByDate(words, date_scope, date, start_date, end_date);
    if (candidateWords.length === 0) {
      let dateLabel = date_scope;
      if (date_scope === 'today') dateLabel = 'Hôm nay';
      else if (date_scope === 'yesterday') dateLabel = 'Hôm qua';
      else if (date_scope === 'last_7_days') dateLabel = '7 ngày gần nhất';
      else if (date_scope === 'last_30_days') dateLabel = '30 ngày gần nhất';
      else if (date_scope === 'range' && (start_date || end_date)) {
        dateLabel = `Từ ${start_date || '...'} đến ${end_date || '...'}`;
      } else if (Array.isArray(date) && date.length > 0) {
        dateLabel = date.map(d => {
          try {
            const [y, m, day] = d.split('-');
            return `${day}/${m}`;
          } catch(e) { return d; }
        }).join(', ');
      } else if (date) {
        try {
          const [y, m, d] = String(date).split('-');
          dateLabel = `Ngày ${d}/${m}/${y}`;
        } catch (e) {
          dateLabel = `Ngày ${date}`;
        }
      }
      throw new Error(`Không có từ vựng nào được thêm vào trong phạm vi [${dateLabel}]. Vui lòng chọn ngày khác hoặc chọn [Toàn bộ]!`);
    }

    // 2. Filter by Single or Multiple Topics
    let topicDisplay = 'Tất cả (All)';

    const resolved = resolveTopics(db, topic);
    if (!resolved.isAll) {
      topicDisplay = resolved.displayNames.join(' + ');
      const topicFiltered = candidateWords.filter(w => {
        const wTopicId = (w.topic_id || '').toLowerCase();
        return resolved.targetIds.includes(wTopicId);
      });

      if (topicFiltered.length === 0) {
        throw new Error(`Các chủ đề đã chọn (${topicDisplay}) chưa có từ vựng nào trong phạm vi ngày đã chọn. Vui lòng chọn chủ đề khác hoặc chọn [Tất cả]!`);
      }
      candidateWords = topicFiltered;
    }

    // 2. Filter by Granular IELTS Level Tier ONLY if explicitly requested (e.g. ielts_4_5)
    // NOTE: 'easy', 'medium', 'hard' represent QUESTION SOLVING DIFFICULTY, NOT vocabulary level!
    if (level && level.startsWith('ielts_')) {
      const tierMap = {
        'ielts_4_5': ['A1', 'A2', 'B1'],
        'ielts_55_60': ['B1', 'B2'],
        'ielts_65_70': ['B2'],
        'ielts_75_80': ['B2', 'C1'],
        'ielts_85_90': ['C1', 'C2']
      };
      const allowedLevels = tierMap[level] || [];
      if (allowedLevels.length > 0) {
        const levelFiltered = candidateWords.filter(w => allowedLevels.includes((w.level || '').toUpperCase()));
        if (levelFiltered.length > 0) {
          candidateWords = levelFiltered;
        }
      }
    }

    const questionDifficulty = ['easy', 'medium', 'hard'].includes(level) ? level : 'all';

    // 3. Quy tắc chọn từ mục tiêu:
    // - Nếu số từ candidate >= targetCount -> Chọn ngẫu nhiên KHÔNG LẶP LẠI
    // - Nếu số từ candidate < targetCount -> Lặp đi lặp lại các từ đó để tạo đủ số câu hỏi
    let selectedWords = [];
    const shuffledCandidates = [...candidateWords].sort(() => 0.5 - Math.random());

    if (shuffledCandidates.length >= targetCount) {
      selectedWords = shuffledCandidates.slice(0, targetCount);
    } else {
      for (let i = 0; i < targetCount; i++) {
        selectedWords.push(shuffledCandidates[i % shuffledCandidates.length]);
      }
    }

    // Question types: 'meaning_vi', 'reverse_en', 'cloze_blank', 'listening'
    const questionTypes = ['meaning_vi', 'reverse_en', 'cloze_blank', 'listening'];

    const questions = selectedWords.map((targetWord, index) => {
      const qType = mode === 'mixed' 
        ? questionTypes[index % questionTypes.length]
        : mode;

      let examples = [];
      try {
        examples = JSON.parse(targetWord.examples || '[]');
      } catch (e) {
        examples = [];
      }

      const validTargetMeaning = cleanMeaningText(targetWord.meaning_vi, targetWord.meaning_en, targetWord.word);

      // Determine question solving difficulty: easy, medium, hard
      let qDifficulty = questionDifficulty;
      if (qDifficulty === 'all') {
        const diffCycle = ['easy', 'medium', 'hard'];
        qDifficulty = diffCycle[index % diffCycle.length];
      }

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];
      let grammarExplanation = '';

      if (qDifficulty === 'easy') {
        // === MỨC DỄ: Câu hỏi trực quan, có gợi ý rõ ràng, đáp án gây nhiễu khác biệt dễ loại trừ ===
        if (qType === 'meaning_vi' || qType === 'listening') {
          questionText = targetWord.word;
          promptSubtitle = qType === 'listening'
            ? `Nghe phát âm và chọn nghĩa tiếng Việt (Gợi ý phiên âm: /${targetWord.phonetic?.replace(/\//g, '') || ''}/):`
            : `Chọn nghĩa tiếng Việt của từ "${targetWord.word}" (${targetWord.part_of_speech ? `Từ loại: ${targetWord.part_of_speech}` : 'từ vựng'}):`;
          correctAnswer = validTargetMeaning;

          const easyPool = EASY_DISTRACTORS.filter(ed => ed.word !== targetWord.word.toLowerCase());
          easyPool.sort(() => 0.5 - Math.random());
          options = [validTargetMeaning, ...easyPool.slice(0, 3).map(e => e.meaning_vi)];
          options = [...new Set(options)].sort(() => 0.5 - Math.random());
        } else if (qType === 'reverse_en') {
          questionText = validTargetMeaning;
          promptSubtitle = `Chọn từ tiếng Anh có nghĩa "${validTargetMeaning}" (Gợi ý: Bắt đầu bằng "${targetWord.word[0].toUpperCase()}...", ${targetWord.word.length} chữ cái):`;
          correctAnswer = targetWord.word;

          const easyPool = EASY_DISTRACTORS.filter(ed => ed.word !== targetWord.word.toLowerCase());
          easyPool.sort(() => 0.5 - Math.random());
          options = [targetWord.word, ...easyPool.slice(0, 3).map(e => e.word)];
          options = [...new Set(options)].sort(() => 0.5 - Math.random());
        } else if (qType === 'cloze_blank') {
          const grammarQ = generateGrammarClozeQuestion({
            targetWord,
            validTargetMeaning,
            examples,
            qDifficulty,
            questionIndex: index,
            otherWords: words
          });
          questionText = grammarQ.questionText;
          promptSubtitle = grammarQ.promptSubtitle;
          correctAnswer = grammarQ.correctAnswer;
          options = grammarQ.options;
          grammarExplanation = grammarQ.explanation;
        }
      } else if (qDifficulty === 'hard') {
        // === MỨC KHÓ: Đánh đố cao, bẫy họ từ (Word Forms), bẫy từ gần nghĩa, không có gợi ý ===
        if (qType === 'meaning_vi' || qType === 'listening') {
          questionText = targetWord.word;
          promptSubtitle = qType === 'listening'
            ? 'Nghe phát âm chuẩn và chọn sắc thái nghĩa chính xác nhất theo ngữ cảnh:'
            : `Phân tích sắc thái chuyên sâu để chọn nghĩa chuẩn xác nhất của từ "${targetWord.word}":`;
          correctAnswer = validTargetMeaning;

          const otherValidWords = words.filter(w => 
            w.id !== targetWord.id && 
            w.word.toLowerCase() !== targetWord.word.toLowerCase() &&
            w.meaning_vi && !w.meaning_vi.includes('Tra cứu thêm')
          );
          otherValidWords.sort(() => 0.5 - Math.random());
          const subtleDistractors = otherValidWords.slice(0, 3).map(d => cleanMeaningText(d.meaning_vi, d.meaning_en, d.word));
          options = [validTargetMeaning, ...subtleDistractors];
          options = [...new Set(options)].sort(() => 0.5 - Math.random());
        } else if (qType === 'reverse_en') {
          questionText = validTargetMeaning;
          promptSubtitle = 'Chọn từ vựng tiếng Anh chính xác nhất theo đúng định nghĩa học thuật:';
          correctAnswer = targetWord.word;

          const wordFamily = generateTrickyWordFamily(targetWord.word);
          const otherWords = words.filter(w => w.id !== targetWord.id).map(w => w.word).sort(() => 0.5 - Math.random());
          options = [targetWord.word, ...wordFamily.slice(0, 2), ...otherWords.slice(0, 3)].slice(0, 4);
          options = [...new Set(options)].sort(() => 0.5 - Math.random());
        } else if (qType === 'cloze_blank') {
          const grammarQ = generateGrammarClozeQuestion({
            targetWord,
            validTargetMeaning,
            examples,
            qDifficulty,
            questionIndex: index,
            otherWords: words
          });
          questionText = grammarQ.questionText;
          promptSubtitle = grammarQ.promptSubtitle;
          correctAnswer = grammarQ.correctAnswer;
          options = grammarQ.options;
          grammarExplanation = grammarQ.explanation;
        }
      } else {
        // === MỨC TRUNG BÌNH: Tiêu chuẩn, đọc hiểu ngữ cảnh câu, phương án cùng từ loại, không gợi ý lộ liễu ===
        const otherValidWords = words.filter(w => 
          w.id !== targetWord.id && 
          w.word.toLowerCase() !== targetWord.word.toLowerCase() &&
          w.meaning_vi && !w.meaning_vi.includes('Tra cứu thêm')
        );
        otherValidWords.sort(() => 0.5 - Math.random());
        let distractors = otherValidWords.slice(0, 3);
        if (distractors.length < 3) {
          distractors = [...distractors, ...HIGH_QUALITY_DISTRACTORS.filter(f => f.word.toLowerCase() !== targetWord.word.toLowerCase())].slice(0, 3);
        }

        if (qType === 'meaning_vi' || qType === 'listening') {
          questionText = targetWord.word;
          promptSubtitle = qType === 'listening' 
            ? 'Nghe phát âm và chọn nghĩa tiếng Việt chính xác:' 
            : 'Chọn nghĩa tiếng Việt chính xác theo ngữ cảnh:';
          correctAnswer = validTargetMeaning;

          const rawOptions = [
            validTargetMeaning,
            ...distractors.map(d => cleanMeaningText(d.meaning_vi, d.meaning_en, d.word))
          ];
          options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
        } else if (qType === 'reverse_en') {
          let cleanDef = validTargetMeaning;
          if (targetWord.word && cleanDef) {
            const regex = new RegExp(`\\b${targetWord.word}\\b`, 'gi');
            cleanDef = cleanDef.replace(regex, '_______');
          }
          questionText = cleanDef;
          promptSubtitle = 'Chọn từ vựng tiếng Anh tương ứng với định nghĩa trên:';
          correctAnswer = targetWord.word;

          const rawOptions = [
            targetWord.word,
            ...distractors.map(d => d.word)
          ];
          options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
        } else if (qType === 'cloze_blank') {
          const grammarQ = generateGrammarClozeQuestion({
            targetWord,
            validTargetMeaning,
            examples,
            qDifficulty,
            questionIndex: index,
            otherWords: words
          });
          questionText = grammarQ.questionText;
          promptSubtitle = grammarQ.promptSubtitle;
          correctAnswer = grammarQ.correctAnswer;
          options = grammarQ.options;
          grammarExplanation = grammarQ.explanation;
        }
      }

      // Ensure 4 distinct options always exist
      const extraPool = [...HIGH_QUALITY_DISTRACTORS, ...words];
      while (options.length < 4) {
        const extra = extraPool.find(e => 
          !options.includes(e.word) && 
          !options.includes(e.meaning_vi)
        );
        if (extra) {
          options.push(qType === 'reverse_en' || qType === 'cloze_blank' ? extra.word : extra.meaning_vi);
        } else {
          options.push(`Lựa chọn bổ sung ${options.length + 1}`);
        }
      }

      // Build detailed explanation and contextual translation
      let explanation = '';
      let translation = '';
      const cleanExString = examples.length > 0 ? (typeof examples[0] === 'string' ? examples[0] : (examples[0]?.en || examples[0]?.sentence || '')) : '';

      if (qType === 'meaning_vi' || qType === 'listening') {
        explanation = `Từ "${targetWord.word}" mang nghĩa chuẩn xác là "${validTargetMeaning}". ${targetWord.part_of_speech ? `[Từ loại: ${targetWord.part_of_speech}]` : ''} ${targetWord.meaning_en ? `Định nghĩa tiếng Anh: ${targetWord.meaning_en}.` : ''}`;
        translation = cleanExString ? `Ví dụ thực tế: "${cleanExString}"` : `Từ vựng: ${targetWord.word} ➔ ${validTargetMeaning}`;
      } else if (qType === 'reverse_en') {
        explanation = `Định nghĩa "${validTargetMeaning}" trong tiếng Anh tương ứng với từ "${targetWord.word}". ${targetWord.phonetic ? `Phiên âm IPA: /${targetWord.phonetic.replace(/\//g, '')}/.` : ''} ${targetWord.meaning_en ? `Định nghĩa: ${targetWord.meaning_en}.` : ''}`;
        translation = cleanExString ? `Ví dụ thực tế: "${cleanExString}"` : `Ý nghĩa: ${validTargetMeaning}`;
      } else if (qType === 'cloze_blank') {
        const completedSentence = questionText.replace(/_______/g, correctAnswer);
        explanation = grammarExplanation || `Điền dạng từ "${correctAnswer}" (${validTargetMeaning}) để hoàn chỉnh câu: "${completedSentence}". ${targetWord.phonetic ? `Phiên âm: /${targetWord.phonetic.replace(/\//g, '')}/.` : ''}`;
        translation = `Câu hoàn chỉnh: "${completedSentence}"`;
      }

      return {
        id: `${targetWord.id}_q${index + 1}`,
        type: qType,
        word: targetWord.word,
        phonetic: targetWord.phonetic,
        difficulty: qDifficulty,
        level: targetWord.level || (qDifficulty === 'easy' ? 'A2' : qDifficulty === 'hard' ? 'C1' : 'B2'),
        meaning_vi: validTargetMeaning,
        meaning_en: targetWord.meaning_en,
        questionText,
        promptSubtitle,
        correctAnswer,
        options,
        explanation,
        translation,
        audio_url: targetWord.audio_url,
        examples
      };
    });

    return {
      topic: topicDisplay,
      mode,
      level,
      totalQuestions: questions.length,
      questions
    };
  },

  // 3. Submit and Grade Quiz
  submitQuiz: ({ answers = [], userId = 'admin_master_user_id' }) => {
    const db = getDb();
    if (!Array.isArray(answers) || answers.length === 0) {
      return {
        totalQuestions: 0,
        correctCount: 0,
        score: 0,
        xpEarned: 0,
        isPerfect: false,
        results: [],
        gamification: null
      };
    }

    let correctCount = 0;
    const results = [];
    const wrongWordIds = [];

    for (const item of answers) {
      const isCorrect = String(item.userAnswer || '').trim().toLowerCase() === String(item.correctAnswer || '').trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else if (item.wordId) {
        wrongWordIds.push(item.wordId);
      }

      results.push({
        id: item.id || item.wordId,
        word: item.word || item.id,
        questionText: item.questionText,
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        isCorrect,
        explanation: item.explanation,
        translation: item.translation
      });
    }

    const total = answers.length;
    const score = Math.round((correctCount / total) * 100);
    // Base 5 XP per correct answer + 10 XP bonus for perfect score
    const xpEarned = (correctCount * 5) + (score === 100 ? 10 : 0);

    // If there are wrong words, update their SRS state in DB (demote slightly for review)
    if (wrongWordIds.length > 0) {
      const placeholders = wrongWordIds.map(() => '?').join(',');
      try {
        // Decrease interval slightly for reinforcement
        db.prepare(`
          UPDATE words 
          SET interval = CASE WHEN interval > 1 THEN interval - 1 ELSE 1 END,
              ease_factor = CASE WHEN ease_factor > 1.4 THEN ease_factor - 0.1 ELSE 1.3 END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${placeholders})
        `).run(...wrongWordIds);
      } catch (e) {
        console.warn('SRS update on quiz wrong answers:', e);
      }
    }

    // Gamification: Add XP for Quiz Completion
    let xpResult = null;
    try {
      xpResult = gamificationService.addXp(userId, xpEarned, `Quiz: Đúng ${correctCount}/${total} câu`);
    } catch (e) {}

    return {
      totalQuestions: total,
      correctCount,
      score,
      xpEarned,
      isPerfect: score === 100,
      results,
      gamification: xpResult
    };
  },

  // 4. Generate Sentence Pattern Quiz
  generatePatternQuiz: ({ category = 'all', tone = 'all', count = 5, mode = 'mixed', level = 'all', date_scope = 'all', date = null, start_date = null, end_date = null, userId = 'admin_master_user_id' }) => {
    const db = getDb();
    let patterns = db.prepare(`
      SELECT * FROM patterns 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    if (patterns.length === 0) {
      throw new Error('Kho mẫu câu & cấu trúc đang trống. Vui lòng thêm mẫu câu trước khi tạo Quiz!');
    }

    const targetCount = Math.max(1, parseInt(count, 10) || 5);

    // Filter by Date Scope if specified
    let candidatePatterns = filterItemsByDate(patterns, date_scope, date, start_date, end_date);
    if (candidatePatterns.length === 0) {
      let dateLabel = date_scope;
      if (date_scope === 'today') dateLabel = 'Hôm nay';
      else if (date_scope === 'yesterday') dateLabel = 'Hôm qua';
      else if (date_scope === 'last_7_days') dateLabel = '7 ngày gần nhất';
      else if (date_scope === 'last_30_days') dateLabel = '30 ngày gần nhất';
      else if (date_scope === 'range' && (start_date || end_date)) {
        dateLabel = `Từ ${start_date || '...'} đến ${end_date || '...'}`;
      } else if (Array.isArray(date) && date.length > 0) {
        dateLabel = date.map(d => {
          try {
            const [y, m, day] = d.split('-');
            return `${day}/${m}`;
          } catch(e) { return d; }
        }).join(', ');
      } else if (date) {
        try {
          const [y, m, d] = String(date).split('-');
          dateLabel = `Ngày ${d}/${m}/${y}`;
        } catch (e) {
          dateLabel = `Ngày ${date}`;
        }
      }
      throw new Error(`Không có mẫu câu nào được thêm vào trong phạm vi [${dateLabel}]. Vui lòng chọn ngày khác!`);
    }

    const filterTarget = (category && category !== 'all') ? category : tone;
    if (filterTarget && filterTarget !== 'all') {
      const filtered = candidatePatterns.filter(p => 
        (p.category || '').toLowerCase() === filterTarget.toLowerCase() ||
        (p.tone || '').toLowerCase().includes(filterTarget.toLowerCase())
      );
      if (filtered.length > 0) candidatePatterns = filtered;
    }

    let selectedPatterns = [];
    const shuffled = [...candidatePatterns].sort(() => 0.5 - Math.random());
    if (shuffled.length >= targetCount) {
      selectedPatterns = shuffled.slice(0, targetCount);
    } else {
      for (let i = 0; i < targetCount; i++) {
        selectedPatterns.push(shuffled[i % shuffled.length]);
      }
    }

    const questions = selectedPatterns.map((pat, idx) => {
      let examples = [];
      try {
        examples = JSON.parse(pat.examples || '[]');
      } catch (e) { examples = []; }

      let cleanEx = examples[0] || `It is essential to understand how to apply ${pat.name} in writing.`;
      const keyPhrase = pat.name.split('(')[0].split('+')[0].trim();

      const pTypes = ['fill_clause', 'meaning_usage', 'formula_check'];
      const qType = pTypes[idx % pTypes.length];

      const otherPatterns = patterns.filter(p => p.id !== pat.id);
      const shuffledOthers = [...otherPatterns].sort(() => 0.5 - Math.random());

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];
      let explanation = pat.explanation || `Cấu trúc: ${pat.formula} - Nghĩa: ${pat.meaning_vi}`;

      if (qType === 'fill_clause' && cleanEx) {
        let clozeSentence = cleanEx;
        if (new RegExp(keyPhrase, 'i').test(cleanEx)) {
          clozeSentence = cleanEx.replace(new RegExp(keyPhrase, 'gi'), '_______');
        } else {
          clozeSentence = `_______, ${cleanEx.replace(/^[^,]+,\s*/, '')}`;
        }
        questionText = clozeSentence;
        promptSubtitle = `Điền mẫu câu / cấu trúc thích hợp vào ngữ cảnh (${pat.meaning_vi}):`;
        correctAnswer = keyPhrase;

        const rawOptions = [
          keyPhrase,
          ...shuffledOthers.slice(0, 3).map(p => p.name.split('(')[0].split('+')[0].trim())
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'meaning_usage') {
        questionText = `Mẫu câu / cấu trúc nào sau đây dùng để diễn tả: "${pat.meaning_vi}"?`;
        promptSubtitle = `Chọn cấu trúc ngữ pháp có nghĩa và sắc thái phù hợp:`;
        correctAnswer = pat.name;

        const rawOptions = [
          pat.name,
          ...shuffledOthers.slice(0, 3).map(p => p.name)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else {
        questionText = `Công thức ngữ pháp chuẩn xác của mẫu câu "${pat.name}" là gì?`;
        promptSubtitle = `Chọn công thức cấu trúc câu chính xác:`;
        correctAnswer = pat.formula;

        const rawOptions = [
          pat.formula,
          ...shuffledOthers.slice(0, 3).map(p => p.formula)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      }

      while (options.length < 4) {
        const fallbacks = [
          'Regardless of + Noun / V-ing',
          'Not only... but also (Inversion)',
          'It is high time + S + V2/ed',
          'Had it not been for + Noun'
        ];
        for (const fb of fallbacks) {
          if (!options.includes(fb)) {
            options.push(fb);
            if (options.length === 4) break;
          }
        }
      }

      let qDifficulty = 'medium';
      if (level === 'easy' || (pat.level || '').toUpperCase() === 'A2' || (pat.level || '').toUpperCase() === 'B1') {
        qDifficulty = 'easy';
      } else if (level === 'hard' || (pat.level || '').toUpperCase() === 'C1' || (pat.level || '').toUpperCase() === 'C2') {
        qDifficulty = 'hard';
      }

      return {
        id: `pq-${idx + 1}`,
        type: qType,
        isPattern: true,
        word: pat.name,
        formula: pat.formula,
        tone: pat.tone,
        difficulty: qDifficulty,
        level: pat.level || (qDifficulty === 'easy' ? 'B1' : qDifficulty === 'hard' ? 'C1' : 'B2'),
        questionText,
        promptSubtitle,
        options,
        correctAnswer,
        explanation
      };
    });

    return {
      topic: '🧩 Mẫu Câu & Cấu Trúc Ngữ Pháp',
      isPatternQuiz: true,
      level,
      totalQuestions: questions.length,
      questions
    };
  }
};
