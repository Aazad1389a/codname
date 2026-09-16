// CODNAME — 20,000 real Persian single-word cards + temporary Halloween event cards.

export const CARD_TYPES = Object.freeze({
  RED: "red",
  BLUE: "blue",
  NEUTRAL: "neutral",
  DARK: "dark",
  BONUS: "bonus"
});

const WORD_SOURCE_URLS = Object.freeze([
  "https://cdn.jsdelivr.net/npm/an-array-of-persian-words@1.0.4/words.json",
  "https://raw.githubusercontent.com/pfndesign/an-array-of-persian-words/main/words.json"
]);
const POOL_SIZE = 20000;
const STORAGE_KEY = "codname-persian-word-pool-v3";

const CURATED_WORDS = Object.freeze([
  "آب","آتش","آسمان","آینه","ابر","ادب","ارزش","امید","انار","انسان",
  "باد","باران","باغ","بچه","برف","برگ","برج","بندر","بهار","بهانه",
  "پاییز","پل","پنجره","پرنده","پرچم","پدر","پازل","پول","پایگاه","پیکان",
  "تاک","تاج","تپه","تخت","تلفن","تلویزیون","توپ","تولد","جام","جاده",
  "جعبه","جنگل","جزیره","جسم","جشن","جوان","حافظه","خانه","خاک","خورشید",
  "در","دریا","دریاچه","درخت","دست","دستگاه","دوست","دوربین","راه","رودخانه",
  "راز","رنگ","رعد","ربات","روز","زمین","زبان","زمان","زن","زندگی",
  "ساعت","سایه","ساحل","سفر","سکه","سنگ","سپر","ستاره","شب","شهر",
  "شیشه","شمع","صدا","صحرا","طبیعت","طبل","طلا","عکس","فانوس","فرودگاه",
  "فصل","فنجان","فردا","فروشگاه","قلم","قلعه","قطار","قلب","قفس","قهرمان",
  "کتاب","کتابخانه","کاغذ","کوه","کشتی","کلید","کودک","کلبه","کارخانه","کاروان",
  "گربه","گنج","گل","گوهر","لباس","لبخند","ماه","مادر","موزه","موسیقی",
  "مزرعه","مرد","مرز","میدان","موج","نامه","نقشه","نگاه","نردبان","نور",
  "پرچین","پژواک","پرسش","پایان","پنبه","پرده","پلاک","پشت","پروانه","پیام",
  "چاه","چای","چراغ","چمدان","چمن","چشمه","چهره","چوب","چرخ","چاقو"
]);

function normalizePersianWord(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/[يى]/g, "ی").replace(/[ك]/g, "ک").trim();
}

function isSinglePersianWord(word) {
  return /^[\u0600-\u06FF]+$/.test(word) && !/[\s\u200c\-ـ_.,،؛:!?؟!]/.test(word);
}

function isValidPool(words) {
  return Array.isArray(words)
    && words.length === POOL_SIZE
    && new Set(words).size === POOL_SIZE
    && words.every(isSinglePersianWord);
}

function readCachedPool() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidPool(parsed)) return null;
    const normalized = parsed.map(normalizePersianWord);
    if (!isValidPool(normalized)) return null;
    return Object.freeze(normalized);
  } catch (_) { return null; }
}

function writeCachedPool(words) {
  if (!isValidPool(words)) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(words)); } catch (_) {}
}

async function fetchWordSource(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      mode: "cors",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`word source HTTP ${response.status}`);
    const source = await response.json();
    return Array.isArray(source) ? source : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function loadRealPersianWords() {
  const cached = readCachedPool();
  if (cached) return cached;

  let lastError = null;
  for (const url of WORD_SOURCE_URLS) {
    try {
      const sourceWords = await fetchWordSource(url);
      const result = [];
      const seen = new Set();
      for (const raw of [...CURATED_WORDS, ...sourceWords]) {
        const word = normalizePersianWord(raw);
        if (!word || !isSinglePersianWord(word) || seen.has(word)) continue;
        seen.add(word);
        result.push(word);
        if (result.length === POOL_SIZE) break;
      }
      if (isValidPool(result)) {
        const pool = Object.freeze(result);
        writeCachedPool(pool);
        return pool;
      }
      lastError = new Error(`Only ${result.length} unique single-word entries were loaded`);
    } catch (error) {
      lastError = error;
      console.warn("CODNAME: word source unavailable:", url, error);
    }
  }

  console.error("CODNAME: Persian dictionary unavailable.", lastError);
  return Object.freeze([]);
}

export const WORD_CARDS = await loadRealPersianWords();

export const HALLOWEEN_WORDS = Object.freeze([
  "کدو","خفاش","جادوگر","شبح","روح","عنکبوت","تار","فانوس","ماسک","جادو","طلسم","نفرین","مومیایی","زامبی","هیولا","قبر","قبرستان","ساحره","جادوخانه","شمع","ماه","شب","سایه","خزنده","گرگینه","جن","روح‌سرگردان","کدوحلوایی","لباس‌مبدل","مهمانی","شیرینی","شکلات","قصه","افسانه","خون‌آشام","هیولاچه","کابوس","راز","تاریکی","مه","طوفان","قلعه","سیاه‌جامه","شنل","چوبدستی","دیگ","معجون","سنگ‌قبر","فانوسک","شب‌گرد","ماه‌گرفتگی","ابر","رعد","برق","جغد","گربه","کلاغ","زاغ","موش","خز","پنجه","دندان","پنجره","زیرزمین","اتاقک","راهرو","دروازه","زنگ","صدا","نجوا","قصه‌گو","قصه‌خانه","شب‌نشینی","ترس","هیجان","جادویی","مرموز","تسخیر","احضار","آیین","نقاب","عروسک","اسکلت","اژدها","گورستان","سنگ‌نوشته","شمعدان","آتشدان","شعله","سیاهی","سرگردان","نگهبان","قصر","برج","سیاهچال","تونل","غار","شبستان","جادوگرک","خاطره","نشانه"
]);

if (WORD_CARDS.length !== POOL_SIZE || WORD_CARDS.some((word) => !isSinglePersianWord(word)) || new Set(WORD_CARDS).size !== POOL_SIZE) {
  throw new Error(`CODNAME card pool must contain exactly ${POOL_SIZE} unique single-word cards; got ${WORD_CARDS.length}.`);
}

function randomize(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeCardId(index) {
  if (globalThis.crypto?.randomUUID) return `local-card-${index}-${crypto.randomUUID()}`;
  return `local-card-${index}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDeck(size = 25, event = "normal") {
  const source = event === "halloween" ? HALLOWEEN_WORDS : WORD_CARDS;
  const uniqueSource = [...new Set(source)];
  const safeSize = Math.max(1, Math.min(Number(size) || 25, uniqueSource.length));
  return randomize(uniqueSource).slice(0, safeSize).map((word, index) => ({
    id: makeCardId(index),
    word,
    position: index,
    type: CARD_TYPES.NEUTRAL,
    revealed: false,
    bonus: false,
    bonusTeam: null
  }));
}

export function createKey(size = 25, mode = "classic", firstTeam = "red") {
  const key = Array(size).fill(CARD_TYPES.NEUTRAL);
  const bonusTeams = Array(size).fill(null);
  const teamA = firstTeam === "red" ? CARD_TYPES.RED : CARD_TYPES.BLUE;
  const teamB = firstTeam === "red" ? CARD_TYPES.BLUE : CARD_TYPES.RED;
  const red = mode === "expanded" ? Math.max(8, Math.ceil(size * 0.30)) : Math.ceil(size * 0.28);
  const blue = mode === "expanded" ? Math.max(8, Math.ceil(size * 0.30)) : Math.ceil(size * 0.28);
  const dark = mode === "chaos" ? 2 : 1;
  const positions = randomize([...Array(size).keys()]);
  let cursor = 0;
  for (let i = 0; i < red && cursor < positions.length; i += 1) key[positions[cursor++]] = teamA;
  for (let i = 0; i < blue && cursor < positions.length; i += 1) key[positions[cursor++]] = teamB;
  for (let i = 0; i < dark && cursor < positions.length; i += 1) key[positions[cursor++]] = CARD_TYPES.DARK;

  if (mode === "expanded" || mode === "chaos") {
    const bonusCount = mode === "chaos" ? 3 : 2;
    const orderedBonusTeams = bonusCount === 2
      ? [teamA, teamB]
      : (Math.random() < 0.5 ? [teamA, teamB, teamA] : [teamA, teamB, teamB]);
    for (let i = 0; i < bonusCount && cursor < positions.length; i += 1) {
      const position = positions[cursor++];
      key[position] = CARD_TYPES.BONUS;
      bonusTeams[position] = orderedBonusTeams[i];
    }
  }

  return { key, bonusTeams };
}

export function buildBoard(size = 25, mode = "classic", firstTeam = "red", event = "normal") {
  const deck = createDeck(size, event);
  const { key, bonusTeams } = createKey(size, mode, firstTeam);
  return deck.map((card, index) => ({
    ...card,
    type: key[index],
    bonus: key[index] === CARD_TYPES.BONUS,
    bonusTeam: bonusTeams[index]
  }));
}

export function visibleType(card, role = "player") {
  if (role === "director" || role === "admin") return card.type;
  return card.revealed ? card.type : null;
}
