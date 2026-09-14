// CODNAME original 10,000-card word pool.
// 100 modifiers × 100 base words = exactly 10,000 unique playable cards.

export const CARD_TYPES = Object.freeze({
    RED: "red",
    BLUE: "blue",
    NEUTRAL: "neutral",
    DARK: "dark",
    BONUS: "bonus"
});

const BASE_WORDS = Object.freeze([
    "آینه","جزیره","رودخانه","ماه","قطب‌نما","قلعه","کتاب","ساعت","باران","کوه",
    "فانوس","ربات","جنگل","نقشه","سفر","بادبادک","موزه","پل","ابر","آتشدان",
    "کلید","دروازه","راز","مدار","ستاره","چراغ","قطار","باغ","ساعت‌شنی","صدا",
    "سایه","شهر","صحرا","اقیانوس","گنج","ماسک","دریاچه","کاغذ","رعد","پنجره",
    "برف","جزوه","بندر","برج","سکه","موج","دوربین","رعدوبرق","کشتی","سیاره",
    "نردبان","باد","مه","غار","مزرعه","رادیو","پرچم","پلکان","قطره","رازنامه",
    "جاده","چراغ‌قوه","روستا","پایگاه","کاروان","ساحل","دره","کاخ","بازار","میدان",
    "کتابخانه","دانشگاه","آزمایشگاه","ایستگاه","فرودگاه","بیمارستان","استادیوم","پارک","باغچه","معبد",
    "کلبه","کارخانه","رصدخانه","آبشار","رنگین‌کمان","طوفان","خورشید","دریا","چشمه","یخچال",
    "ساعت‌برج","نامه","پاکت","نقاشی","موسیقی","فیلم","بازی","پازل","سپر","پرنده"
]);

const CARD_MODIFIERS = Object.freeze([
    "طلایی","آبی","سرخ","سبز","خاموش","روشن","قدیمی","نو","گمشده","پنهان",
    "شیشه‌ای","سنگی","چوبی","آهنی","شبانه","صبحگاهی","سرد","داغ","دور","نزدیک",
    "کوچک","بزرگ","سریع","آرام","بلند","کوتاه","نقره‌ای","برنزی","درخشان","تیره",
    "شفاف","مات","نرم","سخت","سنگین","سبک","گرد","مربع","باریک","پهن",
    "زنده","ساکت","خندان","جدی","تنها","دوتایی","سه‌گانه","چهارگانه","پنج‌لایه","چرخان",
    "پرنور","کم‌نور","گرم","خنک","خیس","خشک","تمیز","کهنه","تازه","شکسته",
    "سالم","نیمه‌شب","نیمروز","صبح‌زود","غروب","زمستانی","تابستانی","بهاری","پاییزی","مه‌آلود",
    "بارانی","برفی","بادی","طوفانی","ساحلی","کوهستانی","شهری","روستایی","بیابانی","جنگلی",
    "فلزی","چرمین","کاغذی","پارچه‌ای","کریستالی","الماسی","یخی","آتشفشانی","مغناطیسی","مکانیکی",
    "هوشمند","مرموز","افسانه‌ای","خیالی","واقعی","سری","ویژه","کمیاب","ناب","مخفی"
]);

export const WORD_CARDS = Object.freeze(
    CARD_MODIFIERS.flatMap(modifier => BASE_WORDS.map(word => `${modifier} ${word}`))
);

if (WORD_CARDS.length !== 10000) {
    throw new Error(`CODNAME card pool must contain exactly 10000 cards; got ${WORD_CARDS.length}.`);
}

function randomize(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function createDeck(size = 25) {
    const safeSize = Math.max(1, Math.min(Number(size) || 25, WORD_CARDS.length));
    return randomize(WORD_CARDS).slice(0, safeSize).map((word, index) => ({
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

export function buildBoard(size = 25, mode = "classic", firstTeam = "red") {
    const deck = createDeck(size);
    const key = createKey(size, mode, firstTeam);
    return deck.map((card, index) => ({ ...card, type: key[index], bonus: key[index] === CARD_TYPES.BONUS }));
}

export function visibleType(card, role = "player") {
    if (role === "director" || role === "admin") return card.type;
    return card.revealed ? card.type : null;
}
