// CODNAME original 2,000-card single-word pool + temporary Halloween event cards.

export const CARD_TYPES = Object.freeze({
  RED: "red",
  BLUE: "blue",
  NEUTRAL: "neutral",
  DARK: "dark",
  BONUS: "bonus"
});

const BASE_WORDS = Object.freeze([
  "آینه","جزیره","رودخانه","ماه","قطب‌نما","قلعه","کتاب","ساعت","باران","کوه","فانوس","ربات","جنگل","نقشه","سفر","بادبادک","موزه","پل","ابر","آتشدان","کلید","دروازه","راز","مدار","ستاره","چراغ","قطار","باغ","ساعت‌شنی","صدا","سایه","شهر","صحرا","اقیانوس","گنج","ماسک","دریاچه","کاغذ","رعد","پنجره","برف","جزوه","بندر","برج","سکه","موج","دوربین","رعدوبرق","کشتی","سیاره","نردبان","باد","مه","غار","مزرعه","رادیو","پرچم","پلکان","قطره","رازنامه","جاده","چراغ‌قوه","روستا","پایگاه","کاروان","ساحل","دره","کاخ","بازار","میدان","کتابخانه","دانشگاه","آزمایشگاه","ایستگاه","فرودگاه","بیمارستان","استادیوم","پارک","باغچه","معبد","کلبه","کارخانه","رصدخانه","آبشار","رنگین‌کمان","طوفان","خورشید","دریا","چشمه","یخچال","ساعت‌برج","نامه","پاکت","نقاشی","موسیقی","فیلم","بازی","پازل","سپر","پرنده"
]);

const CARD_SUFFIXES = Object.freeze([
  "وار","گون","مند","گر","خانه","بان","سرا","ستان","گاه","زار","کده","کاره","چی","کار","ساز","پرداز","نما","پژوه","یار","آسا"
]);

export const WORD_CARDS = Object.freeze(
  CARD_SUFFIXES.flatMap((suffix) => BASE_WORDS.map((word) => `${word}${suffix}`))
);

export const HALLOWEEN_WORDS = Object.freeze([
  "کدو","خفاش","جادوگر","شبح","روح","عنکبوت","تار","فانوس","ماسک","جادو","طلسم","نفرین","مومیایی","زامبی","هیولا","قبر","قبرستان","ساحره","جادوخانه","شمع","ماه","شب","سایه","خزنده","گرگینه","جن","روح‌سرگردان","کدوحلوایی","لباس‌مبدل","مهمانی","شیرینی","شکلات","قصه","افسانه","خون‌آشام","هیولاچه","کابوس","راز","تاریکی","مه","طوفان","قلعه","سیاه‌جامه","شنل","چوبدستی","دیگ","معجون","سنگ‌قبر","فانوسک","شب‌گرد","ماه‌گرفتگی","ابر","رعد","برق","جغد","گربه","کلاغ","زاغ","موش","خز","پنجه","دندان","پنجره","زیرزمین","اتاقک","راهرو","دروازه","زنگ","صدا","نجوا","قصه‌گو","قصه‌خانه","شب‌نشینی","ترس","هیجان","جادویی","مرموز","تسخیر","احضار","آیین","نقاب","عروسک","اسکلت","اژدها","گورستان","سنگ‌نوشته","شمعدان","آتشدان","شعله","سیاهی","سرگردان","نگهبان","قصر","برج","سیاهچال","تونل","غار","شبستان","جادوگرک","خاطره","نشانه"
]);

if (WORD_CARDS.length !== 2000 || WORD_CARDS.some((word) => /\s/.test(word))) {
  throw new Error(`CODNAME card pool must contain exactly 2000 single-word cards; got ${WORD_CARDS.length}.`);
}

function randomize(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createDeck(size = 25, event = "normal") {
  const source = event === "halloween" ? HALLOWEEN_WORDS : WORD_CARDS;
  const safeSize = Math.max(1, Math.min(Number(size) || 25, source.length));
  return randomize(source).slice(0, safeSize).map((word, index) => ({
    id: `local-card-${index}-${crypto.randomUUID()}`,
    word,
    position: index,
    type: CARD_TYPES.NEUTRAL,
    revealed: false,
    bonus: false
  }));
}

export function createKey(size = 25, mode = "classic", firstTeam = "red") {
  const key = Array(size).fill(CARD_TYPES.NEUTRAL);
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
    for (let i = 0; i < bonusCount && cursor < positions.length; i += 1) key[positions[cursor++]] = CARD_TYPES.BONUS;
  }
  return key;
}

export function buildBoard(size = 25, mode = "classic", firstTeam = "red", event = "normal") {
  const deck = createDeck(size, event);
  const key = createKey(size, mode, firstTeam);
  return deck.map((card, index) => ({
    ...card,
    type: key[index],
    bonus: key[index] === CARD_TYPES.BONUS
  }));
}

export function visibleType(card, role = "player") {
  if (role === "director" || role === "admin") return card.type;
  return card.revealed ? card.type : null;
}
