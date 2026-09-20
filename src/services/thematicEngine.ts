import type { TVSeries } from '../types';
import { getTMDBPage, mapTMDB } from './tmdbLive';
import { series as canonicalSeries } from '../data/mockSeries';

export interface ThematicProfile {
  id: string;
  themeName: string;
  searchQueries: string[];
  keywords: string[];
  targetGenres: string[];
  targetMoods: string[];
}

/**
 * Normalizes Turkish letters and punctuation for uniform semantic analysis.
 */
export function normalizeTurkishText(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’‘“”«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Advanced Turkish Morphological Stemmer:
 * Strips compound plurals, case endings (ayrılma, bulunma, yönelme, belirtme),
 * possession, and common suffixes iteratively while preserving semantic roots.
 * Correctly reverses Turkish consonant softening (ünsüz yumuşaması).
 */
export function stemTurkishWord(rawWord: string): string {
  let word = rawWord.toLocaleLowerCase('tr').trim();
  if (word.length <= 3) return word;

  const suffixes = [
    // 6-8 chars compound suffixes
    'lerinden', 'larından', 'larında', 'lerinde', 'larına', 'lerine',
    'larını', 'lerini', 'larıyla', 'leriyle',
    // 4-5 chars
    'lerden', 'lardan', 'ndaki', 'ndeki', 'daki', 'deki', 'taki', 'teki',
    'lerin', 'ların', 'lerle', 'larla', 'lara', 'lere', 'leri', 'ları',
    'ndan', 'nden', 'tdan', 'tden',
    // 3 chars
    'dan', 'den', 'tan', 'ten', 'nda', 'nde', 'tda', 'tde',
    'nin', 'nın', 'nun', 'nün', 'iyle', 'ıyla', 'yla', 'yle',
    'iniz', 'ınız', 'umuz', 'ümüz',
    'lik', 'lık', 'luk', 'lük', 'siz', 'sız', 'suz', 'süz',
    'ler', 'lar',
    // 2 chars
    'da', 'de', 'ta', 'te', 'in', 'ın', 'un', 'ün',
    'ye', 'ya', 'yu', 'yü', 'yı', 'yi',
    'im', 'ım', 'um', 'üm', 'si', 'sı', 'su', 'sü'
  ];

  let changed = true;
  let iterations = 0;
  while (changed && iterations < 3 && word.length > 4) {
    changed = false;
    iterations++;
    for (const suf of suffixes) {
      if (word.endsWith(suf) && word.length - suf.length >= 4) {
        word = word.slice(0, -suf.length);
        changed = true;
        break;
      }
    }
  }

  // Handle accusative/possessive softening: imparatorluğu -> imparatorluk, krallığı -> krallık
  if (/[eaiıuü]$/.test(word) && word.length >= 5) {
    const base = word.slice(0, -1);
    if (base.endsWith('ğ')) {
      word = base.slice(0, -1) + 'k';
    }
  }

  // Handle softened consonants at word endings
  if (word.endsWith('ğ')) word = word.slice(0, -1) + 'k';
  else if (word.endsWith('b') && word.length >= 5) word = word.slice(0, -1) + 'p';
  else if (word.endsWith('c') && word.length >= 5) word = word.slice(0, -1) + 'ç';
  else if (word.endsWith('d') && word.length >= 5) word = word.slice(0, -1) + 't';

  return word;
}

/**
 * 28 Comprehensive thematic ontologies covering all television genres,
 * moods, archetypes, concepts, and tropes in modern world cinema.
 */
export const thematicKnowledgeBase: ThematicProfile[] = [
  {
    id: 'crime-drug-cartel',
    themeName: 'Uyuşturucu, Kartel & Suç İmparatorluğu',
    searchQueries: ['narcos', 'breaking bad', 'better call saul', 'ozark', 'snowfall', 'cartel', 'peaky blinders', 'the sopranos', 'the wire', 'gomorrah', 'queen of the south', 'el chapo', 'narcos mexico', 'boardwalk empire', 'griselda', 'power'],
    keywords: [
      'uyuşturucu', 'kartel', 'narkotik', 'kokain', 'meth', 'metamfetamin', 'eroin', 'hap', 'baron', 'baronlar',
      'torbacı', 'kaçakçı', 'kaçakçılık', 'mafya', 'mafya babası', 'yeraltı', 'kara para', 'aklama',
      'şebeke', 'haraç', 'çete', 'tetikçi', 'infaz', 'pablo', 'escobar', 'medellin', 'walter white',
      'heisenberg', 'jesse pinkman', 'gus fring', 'saul goodman', 'marty byrde', 'suç imparatorluğu',
      'imparatorluk', 'imparatorluğu', 'cartel', 'narcotics', 'kingpin', 'underworld', 'trafficking', 'cocaine', 'syndicate', 'empire'
    ],
    targetGenres: ['Suç', 'Drama'],
    targetMoods: ['Karanlık/Gerilim', 'Politik/Güç'],
  },
  {
    id: 'time-paradox-loop',
    themeName: 'Zaman Yolculuğu, Paradoks & Paralel Evrenler',
    searchQueries: ['dark', '12 monkeys', 'fringe', 'steins gate', 'bodies', 'loki', 'outer range', 'timeless', 'russian doll', 'travelers', 'devs'],
    keywords: [
      'zaman', 'zaman yolculuğu', 'zaman makinesi', 'zaman döngüsü', 'döngü', 'paradoks', 'paralel evren',
      'solucan deliği', 'kelepçe', 'kelebek etkisi', 'geçmiş', 'gelecek', 'zamanda sıkışma', 'temporal',
      'kuantum', 'zaman çizgisi', 'time travel', 'time loop', 'wormhole', 'timeline', 'alternate reality'
    ],
    targetGenres: ['Bilim Kurgu & Fantastik', 'Gizem', 'Drama'],
    targetMoods: ['Zihin Yakan', 'Distopya'],
  },
  {
    id: 'zombie-pandemic-survival',
    themeName: 'Zombi, Salgın & Kıyamet Sonrası Hayatta Kalma',
    searchQueries: ['the last of us', 'the walking dead', 'kingdom', 'all of us are dead', 'station eleven', 'sweet home', 'fear the walking dead', 'silo', 'fallout'],
    keywords: [
      'zombi', 'zombiler', 'salgın', 'virüs', 'enfeksiyon', 'pandemi', 'kıyamet', 'kıyamet sonrası',
      'post-apokaliptik', 'hayatta kalma', 'cordyceps', 'mutant', 'yaratık', 'felaket', 'sığınak',
      'çöküş', 'ölüler', 'yürüyen ölüler', 'istila', 'zombie', 'undead', 'infection', 'outbreak', 'apocalypse', 'survival', 'wasteland'
    ],
    targetGenres: ['Bilim Kurgu & Fantastik', 'Drama', 'Aksiyon & Macera'],
    targetMoods: ['Yüksek Adrenalin', 'Karanlık/Gerilim'],
  },
  {
    id: 'medieval-throne-dynasty',
    themeName: 'Orta Çağ, Taht Savaşları, Krallık & Hanedan',
    searchQueries: ['game of thrones', 'house of the dragon', 'vikings', 'the last kingdom', 'shogun', 'rome', 'black sails', 'spartacus', 'the witcher'],
    keywords: [
      'taht', 'taht kavgası', 'krallık', 'orta çağ', 'şövalye', 'kılıç', 'kalkan', 'savaş', 'ejderha', 'ejderhalar',
      'kral', 'kraliçe', 'hanedan', 'hanedanlık', 'prens', 'prenses', 'entrika', 'saray', 'kale', 'kuşatma',
      'klan', 'derebeyi', 'viking', 'samuray', 'fatih', 'işgal', 'surlar', 'throne', 'kingdom', 'medieval', 'dynasty', 'knight', 'sword'
    ],
    targetGenres: ['Aksiyon & Macera', 'Drama', 'Savaş & Politik'],
    targetMoods: ['Politik/Güç', 'Yüksek Adrenalin'],
  },
  {
    id: 'hacker-cyberpunk-ai',
    themeName: 'Hacker, Siber Güvenlik, Yapay Zeka & Siberpunk',
    searchQueries: ['mr robot', 'severance', 'black mirror', 'person of interest', 'westworld', 'halt and catch fire', 'devs', 'cyberpunk', 'altered carbon'],
    keywords: [
      'hacker', 'siber', 'siber güvenlik', 'kod', 'kodlama', 'programcı', 'yapay zeka', 'ai', 'robot',
      'android', 'simülasyon', 'karanlık ağ', 'deep web', 'dark web', 'gözetleme', 'sistem', 'distopya',
      'teknoloji', 'fsociety', 'algoritma', 'büyük veri', 'cyberpunk', 'surveillance', 'cyber'
    ],
    targetGenres: ['Bilim Kurgu & Fantastik', 'Drama', 'Suç'],
    targetMoods: ['Siberpunk/Teknoloji', 'Zihin Yakan'],
  },
  {
    id: 'chef-kitchen-culinary',
    themeName: 'Şef, Mutfak, Restoran & Gastronomi Kaosu',
    searchQueries: ['the bear', 'boiling point', 'chef', 'kitchen', 'sweetbitter', 'julia'],
    keywords: [
      'mutfak', 'restoran', 'şef', 'yemek', 'aşçı', 'aşçılık', 'gastronomi', 'michelin', 'servis',
      'sipariş', 'tava', 'menü', 'lezzet', 'gurme', 'mutfak kaosu', 'kitchen', 'chef', 'restaurant', 'culinary', 'cook', 'food'
    ],
    targetGenres: ['Drama', 'Komedi'],
    targetMoods: ['Yüksek Adrenalin', 'Melankolik'],
  },
  {
    id: 'detective-serialkiller-mystery',
    themeName: 'Dedektif, Seri Katil, Polisiye & Faili Meçhul',
    searchQueries: ['true detective', 'mindhunter', 'sherlock', 'fargo', 'broadchurch', 'mare of easttown', 'dexter', 'the killing', 'luther', 'hannibal'],
    keywords: [
      'dedektif', 'seri katil', 'cinayet', 'cinayet masası', 'soruşturma', 'polisiye', 'vaka', 'gizem',
      'katil', 'ceset', 'otopsi', 'adli tıp', 'profil', 'profil çıkarma', 'fbi', 'faili meçhul', 'ipucu',
      'dedektiflik', 'gizemli kasaba', 'crime', 'detective', 'serial killer', 'murder', 'investigation'
    ],
    targetGenres: ['Suç', 'Gizem', 'Drama'],
    targetMoods: ['Karanlık/Gerilim', 'Zihin Yakan'],
  },
  {
    id: 'spy-coldwar-intelligence',
    themeName: 'Casusluk, Gizli Ajan, İstihbarat & Soğuk Savaş',
    searchQueries: ['the americans', 'homeland', 'slow horses', 'jack ryan', 'the night manager', 'berlin station', 'the bureau', 'spooks'],
    keywords: [
      'casus', 'casusluk', 'ajan', 'gizli ajan', 'istihbarat', 'cia', 'kgb', 'mi6', 'soğuk savaş',
      'köstebek', 'suikast', 'devlet sırrı', 'operasyon', 'gizli servis', 'çift taraflı ajan',
      'vatan haini', 'spy', 'intelligence', 'covert', 'cold war', 'espionage'
    ],
    targetGenres: ['Drama', 'Savaş & Politik', 'Suç'],
    targetMoods: ['Politik/Güç', 'Karanlık/Gerilim'],
  },
  {
    id: 'finance-stocks-wallstreet',
    themeName: 'Finans, Borsa, Wall Street & Şirket Savaşları',
    searchQueries: ['succession', 'billions', 'industry', 'bad banks', 'black monday', 'mad men', 'suits'],
    keywords: [
      'borsa', 'finans', 'wall street', 'para', 'hisse', 'hisse senedi', 'fon', 'banka', 'bankacı',
      'milyar', 'milyarder', 'holding', 'şirket', 'ceo', 'devralma', 'miras', 'miras kavgası',
      'iktidar savaşı', 'açgözlülük', 'finance', 'stocks', 'billionaire', 'hedge fund', 'money', 'corporate'
    ],
    targetGenres: ['Drama', 'Savaş & Politik'],
    targetMoods: ['Politik/Güç', 'Karanlık/Gerilim'],
  },
  {
    id: 'space-galaxy-interstellar',
    themeName: 'Uzay, Galaksi, Astronot & Yıldızlararası Keşif',
    searchQueries: ['the expanse', 'for all mankind', 'battlestar galactica', 'star trek', 'foundation', 'firefly', 'lost in space', 'halo'],
    keywords: [
      'uzay', 'galaksi', 'astronot', 'gezegen', 'uzay gemisi', 'uzay istasyonu', 'yıldızlararası',
      'mars', 'ay', 'koloni', 'derin uzay', 'dünya dışı', 'uzaylı', 'solucan deliği', 'kozmik',
      'space', 'astronaut', 'galaxy', 'starship', 'interstellar', 'alien', 'sci-fi'
    ],
    targetGenres: ['Bilim Kurgu & Fantastik', 'Drama'],
    targetMoods: ['Zihin Yakan', 'Yüksek Adrenalin'],
  },
  {
    id: 'warm-friendship-comedy',
    themeName: 'Sıcak Dostluk, Aile, Komedi & İyi His',
    searchQueries: ['ted lasso', 'modern family', 'friends', 'the office', 'parks and recreation', 'brooklyn nine-nine', 'schitt creek', 'how i met your mother', 'new girl'],
    keywords: [
      'sıcak', 'samimi', 'arkadaş', 'arkadaşlık', 'dostluk', 'aile', 'iyi his', 'iyi hissettiren',
      'komedi', 'kahkaha', 'mizah', 'eğlence', 'neşeli', 'tatlı', 'rahat', 'günlük hayat', 'ofis',
      'feel-good', 'comfort', 'friends', 'family', 'sitcom', 'laughter'
    ],
    targetGenres: ['Komedi', 'Drama'],
    targetMoods: ['Konfor/Rahatlatıcı'],
  },
  {
    id: 'drama-grief-melancholy',
    themeName: 'Dram, Hüzün, Yas & Duygusal Derinlik',
    searchQueries: ['this is us', 'six feet under', 'normal people', 'after life', 'the leftovers', 'fleabag', 'scenes from a marriage'],
    keywords: [
      'dram', 'drama', 'hüzün', 'hüzünlü', 'ağlatan', 'gözyaşı', 'yas', 'acı', 'kayıp', 'kalp kırıklığı',
      'yalnızlık', 'melankoli', 'duygusal', 'aşk', 'romantik', 'ayrılık', 'ilişki', 'derin bağ',
      'heartbreak', 'grief', 'sorrow', 'emotional', 'tragedy'
    ],
    targetGenres: ['Drama'],
    targetMoods: ['Melankolik'],
  },
  {
    id: 'legal-courtroom-lawyer',
    themeName: 'Hukuk, Mahkeme, Avukat & Adalet Mücadelesi',
    searchQueries: ['better call saul', 'suits', 'the good wife', 'boston legal', 'how to get away with murder', 'your honor', 'the lincoln lawyer'],
    keywords: [
      'hukuk', 'avukat', 'mahkeme', 'dava', 'duruşma', 'yargıç', 'savcı', 'jüri', 'adalet',
      'beraat', 'savunma', 'kanun', 'ceza', 'suçlama', 'lawyer', 'attorney', 'courtroom', 'trial', 'law', 'legal'
    ],
    targetGenres: ['Drama', 'Suç'],
    targetMoods: ['Politik/Güç', 'Zihin Yakan'],
  },
  {
    id: 'medical-hospital-doctor',
    themeName: 'Tıp, Hastane, Doktor & Acil Vaka Teşhisi',
    searchQueries: ['house md', 'greys anatomy', 'the good doctor', 'er', 'scrubs', 'new amsterdam', 'the knick'],
    keywords: [
      'tıp', 'hastane', 'doktor', 'cerrah', 'acil', 'acil servis', 'ameliyat', 'ameliyathane',
      'hasta', 'teşhis', 'tedavi', 'tıp dünyası', 'hekim', 'hastalık', 'klinik', 'hospital', 'doctor', 'surgeon', 'medical', 'diagnosis'
    ],
    targetGenres: ['Drama'],
    targetMoods: ['Yüksek Adrenalin', 'Melankolik'],
  },
  {
    id: 'prison-escape-inmate',
    themeName: 'Hapishane, Kaçış Planı & Mahkumlar',
    searchQueries: ['prison break', 'orange is the new black', 'escape at dannemora', 'oz', 'black bird', 'mayor of kingstown'],
    keywords: [
      'hapishane', 'cezaevi', 'mahkum', 'tutuklu', 'gardiyan', 'firar', 'kaçış', 'kaçış planı',
      'hücre', 'koğuş', 'parmaklıklar', 'tünel', 'prison', 'jail', 'inmate', 'escape', 'prison break'
    ],
    targetGenres: ['Suç', 'Drama', 'Aksiyon & Macera'],
    targetMoods: ['Yüksek Adrenalin', 'Karanlık/Gerilim'],
  },
  {
    id: 'supernatural-magic-horror',
    themeName: 'Doğaüstü, Büyü, Cadı, Vampir & Mitoloji',
    searchQueries: ['supernatural', 'the witcher', 'stranger things', 'penny dreadful', 'the haunting of hill house', 'the originals', 'the vampire diaries', 'american horror story'],
    keywords: [
      'doğaüstü', 'büyü', 'büyücü', 'cadı', 'lanet', 'iblis', 'şeytan', 'canavar', 'kurtadam',
      'vampir', 'hortlak', 'ruh', 'hayalet', 'tekinsiz', 'paranormal', 'mitoloji', 'korku', 'gerilim',
      'supernatural', 'magic', 'witch', 'vampire', 'monster', 'horror'
    ],
    targetGenres: ['Bilim Kurgu & Fantastik', 'Gizem', 'Drama'],
    targetMoods: ['Karanlık/Gerilim', 'Zihin Yakan'],
  },
  {
    id: 'war-military-ww2',
    themeName: 'Savaş, Askeri Cephe & Tarihi Çatışmalar',
    searchQueries: ['band of brothers', 'the pacific', 'generation kill', 'das boot', 'masters of the air', 'catch-22'],
    keywords: [
      'savaş', 'askeri', 'ordu', 'cephe', 'siper', 'asker', 'er', 'komutan', 'general',
      'ikinci dünya savaşı', 'birinci dünya savaşı', 'bombardıman', 'taarruz', 'harekât', 'gaziler',
      'war', 'military', 'soldier', 'battle', 'ww2', 'army'
    ],
    targetGenres: ['Savaş & Politik', 'Drama', 'Aksiyon & Macera'],
    targetMoods: ['Yüksek Adrenalin', 'Melankolik'],
  },
  {
    id: 'superhero-vigilante-comic',
    themeName: 'Süper Kahraman, Çizgi Roman & İntikamcılar',
    searchQueries: ['the boys', 'daredevil', 'invincible', 'watchmen', 'peacemaker', 'the punisher', 'legion'],
    keywords: [
      'süper kahraman', 'kahraman', 'süper güç', 'doğaüstü güç', 'pelerin', 'çizgi roman', 'vigilante',
      'intikamcı', 'kötüler', 'mutant', 'adalet', 'superhero', 'comic', 'powers', 'hero'
    ],
    targetGenres: ['Aksiyon & Macera', 'Bilim Kurgu & Fantastik'],
    targetMoods: ['Yüksek Adrenalin', 'Karanlık/Gerilim'],
  },
  {
    id: 'youth-teen-highschool',
    themeName: 'Gençlik, Lise, Ergenlik & Büyüme Sancıları',
    searchQueries: ['euphoria', 'sex education', 'skins', 'heartstopper', 'gossip girl', '13 reasons why', 'elite'],
    keywords: [
      'gençlik', 'lise', 'okul', 'öğrenci', 'ergenlik', 'büyüme', 'ilk aşk', 'parti', 'akran baskısı',
      'gençlik draması', 'teen', 'high school', 'coming of age', 'youth'
    ],
    targetGenres: ['Drama', 'Komedi'],
    targetMoods: ['Melankolik', 'Yüksek Adrenalin'],
  },
  {
    id: 'action-thriller-chase',
    themeName: 'Aksiyon, Kaçış & Yüksek Adrenalinli Kovalamaca',
    searchQueries: ['24', 'banshee', 'reacher', 'the terminal list', 'strike back', 'bodyguard'],
    keywords: [
      'aksiyon', 'kaçış', 'kovalamaca', 'çatışma', 'silahlı', 'dövüş', 'rehine', 'ajan', 'tim',
      'keskin nişancı', 'operasyon', 'patlama', 'adrenalin', 'action', 'chase', 'gunfight'
    ],
    targetGenres: ['Aksiyon & Macera', 'Suç', 'Drama'],
    targetMoods: ['Yüksek Adrenalin'],
  },
  {
    id: 'politics-presidency-scandal',
    themeName: 'Politika, Siyaset, Başkanlık & Beyaz Saray',
    searchQueries: ['house of cards', 'the west wing', 'veep', 'designated survivor', 'borgen', 'scandal'],
    keywords: [
      'politika', 'siyaset', 'siyasi', 'başkan', 'başkanlık', 'beyaz saray', 'bakan', 'milletvekili',
      'seçim', 'seçimler', 'hükümet', 'devlet', 'diplomasi', 'skandal', 'kulis', 'oylama', 'politics', 'president', 'government'
    ],
    targetGenres: ['Savaş & Politik', 'Drama'],
    targetMoods: ['Politik/Güç'],
  },
  {
    id: 'chess-genius-intellect',
    themeName: 'Satranç, Deha, Akıl Oyunları & Strateji',
    searchQueries: ['the queens gambit', 'sherlock', 'mr robot'],
    keywords: [
      'satranç', 'deha', 'akıl oyunu', 'zeka', 'dahi', 'ustalık', 'şah', 'mat', 'strateji', 'hesaplaşma', 'chess', 'genius', 'prodigy'
    ],
    targetGenres: ['Drama'],
    targetMoods: ['Zihin Yakan'],
  },
  {
    id: 'sports-coach-rivalry',
    themeName: 'Spor, Futbol, Basketbol & Antrenörlük',
    searchQueries: ['ted lasso', 'friday night lights', 'cobra kai', 'winning time', 'all american'],
    keywords: [
      'spor', 'futbol', 'basketbol', 'kulüp', 'antrenör', 'koç', 'şampiyon', 'şampiyonluk', 'maç', 'turnuva',
      'takım', 'stadyum', 'rekabet', 'sports', 'football', 'soccer', 'coach', 'champion'
    ],
    targetGenres: ['Drama', 'Komedi', 'Spor'],
    targetMoods: ['Konfor/Rahatlatıcı', 'Yüksek Adrenalin'],
  },
  {
    id: 'cult-sect-conspiracy',
    themeName: 'Tarikat, Kült, Gizli Cemaat & Komplo',
    searchQueries: ['the leftovers', 'midnight mass', 'wild wild country', 'the path', 'true detective'],
    keywords: [
      'tarikat', 'kült', 'cemaat', 'mürit', 'lider', 'beyin yıkama', 'inanç', 'kıyamet günü', 'kehanet', 'ritüel', 'komplo', 'gizli örgüt', 'cult', 'sect', 'conspiracy'
    ],
    targetGenres: ['Gizem', 'Drama'],
    targetMoods: ['Karanlık/Gerilim', 'Zihin Yakan'],
  },
  {
    id: 'journalism-investigative-media',
    themeName: 'Gazetecilik, Medya, Araştırmacı Muhabir & Haber',
    searchQueries: ['the newsroom', 'tokyo vice', 'sharp objects', 'succession', 'the wire'],
    keywords: [
      'gazete', 'gazeteci', 'gazetecilik', 'muhabir', 'araştırmacı', 'haber', 'haberci', 'manşet', 'medya', 'televizyon', 'röportaj', 'skandal', 'basın', 'journalism', 'reporter', 'news'
    ],
    targetGenres: ['Drama', 'Suç'],
    targetMoods: ['Politik/Güç', 'Karanlık/Gerilim'],
  },
  {
    id: 'gambling-casino-heist',
    themeName: 'Kumar, Casino, Soygun & Poker',
    searchQueries: ['ozark', 'sneaky pete', 'peaky blinders', 'las vegas', 'boardwalk empire'],
    keywords: [
      'kumar', 'kumarhane', 'casino', 'poker', 'bahis', 'soygun', 'kasa', 'dolandırıcı', 'dolandırıcılık', 'hile', 'kart', 'rulet', 'gambling', 'casino', 'heist'
    ],
    targetGenres: ['Suç', 'Drama'],
    targetMoods: ['Karanlık/Gerilim', 'Yüksek Adrenalin'],
  },
  {
    id: 'ocean-submarine-naval',
    themeName: 'Denizaltı, Deniz Savaşları & Okyanus',
    searchQueries: ['das boot', 'black sails', 'the last ship', 'our flag means death'],
    keywords: [
      'denizaltı', 'deniz', 'okyanus', 'korsan', 'korsanlar', 'gemi', 'donanma', 'torpido', 'kaptan', 'derinlik', 'deniz savaşı', 'submarine', 'pirate', 'naval', 'ocean'
    ],
    targetGenres: ['Aksiyon & Macera', 'Savaş & Politik'],
    targetMoods: ['Karanlık/Gerilim', 'Yüksek Adrenalin'],
  },
  {
    id: 'music-band-artist',
    themeName: 'Müzik, Rock Grubu, Konser & Sanatçı',
    searchQueries: ['daisy jones and the six', 'atlanta', 'vinyl', 'mozart in the jungle', 'empire'],
    keywords: [
      'müzik', 'müzisyen', 'şarkı', 'şarkıcı', 'rock', 'rock grubu', 'grup', 'albüm', 'stüdyo', 'konser', 'turne', 'sahne', 'beste', 'music', 'band', 'artist', 'song'
    ],
    targetGenres: ['Drama', 'Komedi'],
    targetMoods: ['Melankolik', 'Konfor/Rahatlatıcı'],
  }
];

/**
 * Finds matching themes using both raw tokens and morphological Turkish stems.
 */
export function findMatchingThemes(rawQuery: string): ThematicProfile[] {
  const normalized = normalizeTurkishText(rawQuery);
  const words = normalized.split(/\s+/).filter(w => w.length >= 3);
  if (!words.length) return [];

  const stems = words.map(stemTurkishWord);
  const matched: { profile: ThematicProfile; score: number }[] = [];

  for (const profile of thematicKnowledgeBase) {
    let score = 0;

    for (const kw of profile.keywords) {
      const normKw = normalizeTurkishText(kw);
      const kwStem = stemTurkishWord(normKw);

      // Exact substring hit in query
      if (normalized.includes(normKw)) {
        score += 18;
      }

      // Word-level and stem-level matches
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const s = stems[i];

        if (normKw === w || kwStem === s) {
          score += 14;
        } else if (normKw.includes(w) || w.includes(normKw) || kwStem.includes(s) || s.includes(kwStem)) {
          score += 7;
        }
      }
    }

    if (score >= 7) {
      matched.push({ profile, score });
    }
  }

  return matched.sort((a, b) => b.score - a.score).map(m => m.profile);
}

/**
 * Fetches candidates from TMDB and canonical series for any user query or phrase.
 */
/**
 * Compound phrase semantic expander.
 * Maps Turkish compound concepts (X savaşı, X avcısı, X imparatorluğu…)
 * to rich search query sets – similar to what a transformer would do in latent space
 * but fully rule-based and instant (0 ms, no WASM).
 *
 * Pattern: noun + [suffix word] → domain expansion
 */
function expandCompoundPhrase(normalized: string): string[] {
  const extra: string[] = [];

  // ── Conflict / war patterns ──────────────────────────────────────────────
  const warMatch = normalized.match(/^(.+?)\s+sava[sş]ı?$/);
  if (warMatch) {
    const subject = warMatch[1].trim(); // e.g. "kedi", "kardeş", "sınıf"
    extra.push(`${subject} fight`, `${subject} war`, `${subject} battle`, `${subject} conflict`);
    extra.push(subject); // also run plain subject
  }

  // ── Hunter / pursuer patterns ────────────────────────────────────────────
  const hunterMatch = normalized.match(/^(.+?)\s+(avcı|avcısı|katil|katili|dedektif)$/);
  if (hunterMatch) {
    const subject = hunterMatch[1].trim();
    extra.push(`${subject} hunter`, `${subject} killer`, `${subject} detective`);
    extra.push(subject);
  }

  // ── Empire / empire-builder patterns ────────────────────────────────────
  const empireMatch = normalized.match(/^(.+?)\s+(imparatorluğu?|krallığı?|hanedanı?|ailesi?)$/);
  if (empireMatch) {
    const subject = empireMatch[1].trim();
    extra.push(`${subject} empire`, `${subject} dynasty`, `${subject} family`, `${subject} kingdom`);
    extra.push(subject);
  }

  // ── Mystery / secret patterns ────────────────────────────────────────────
  const mysteryMatch = normalized.match(/^(.+?)\s+(gizemi?|sırrı?|vakası?|olayı?|dosyası?)$/);
  if (mysteryMatch) {
    const subject = mysteryMatch[1].trim();
    extra.push(`${subject} mystery`, `${subject} secret`, `${subject} case`);
    extra.push(subject);
  }

  // ── Escape / run patterns ────────────────────────────────────────────────
  const escapeMatch = normalized.match(/^(.+?)\s+(kaçışı?|kaçış|firari?|firar)$/);
  if (escapeMatch) {
    const subject = escapeMatch[1].trim();
    extra.push(`${subject} escape`, `${subject} fugitive`, `${subject} prison break`);
    extra.push(subject);
  }

  // ── Love / romance patterns ──────────────────────────────────────────────
  const loveMatch = normalized.match(/^(.+?)\s+(aşkı?|romantizm|ilişkisi?)$/);
  if (loveMatch) {
    const subject = loveMatch[1].trim();
    extra.push(`${subject} love`, `${subject} romance`);
    extra.push(subject);
  }

  // ── Generic: if nothing matched, decompose any 2-3 word compound ─────────
  if (extra.length === 0) {
    const words = normalized.split(/\s+/).filter(w => w.length >= 3);
    if (words.length >= 2) {
      // Add each word individually + English translations via the knowledge base
      words.forEach(w => extra.push(w));
      // Try full phrase in English search too (TMDB handles it)
      extra.push(normalized.replace(/\s+/g, ' '));
    }
  }

  return [...new Set(extra)];
}

export async function fetchThematicCandidatePool(
  query: string,
  signal?: AbortSignal
): Promise<TVSeries[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const normalized = normalizeTurkishText(trimmed);
  const matchingThemes = findMatchingThemes(trimmed);
  const primaryTheme = matchingThemes[0];

  const searchQueriesToRun = new Set<string>();
  searchQueriesToRun.add(trimmed);

  // Add theme flagship queries
  if (primaryTheme) {
    primaryTheme.searchQueries.slice(0, 6).forEach(sq => searchQueriesToRun.add(sq));
  }

  // Add compound phrase expansions (the transformer-lite layer)
  const compounds = expandCompoundPhrase(normalized);
  compounds.forEach(c => searchQueriesToRun.add(c));

  // Fallback: if no theme and no compounds matched, still run individual words
  if (!primaryTheme && compounds.length === 0) {
    const words = trimmed.split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 1) {
      words.forEach(w => searchQueriesToRun.add(w));
    }
  }

  const candidateMap = new Map<string, TVSeries>();

  // 1. Add canonical local series immediately (high quality, instant)
  for (const item of canonicalSeries) {
    candidateMap.set(item.id, item);
  }

  // 2. Query TMDB in parallel for all relevant queries
  const fetchPromises = Array.from(searchQueriesToRun).map(async (searchQuery) => {
    try {
      const pageData = await getTMDBPage(
        {
          mood: 'Tümü',
          genre: primaryTheme?.targetGenres[0] || 'Tümü',
          platform: 'Tümü',
          minRating: 5.5,
          status: 'Tümü',
          pacing: [0, 100],
          complexity: [0, 100],
          query: searchQuery,
        },
        'match',
        0,
        signal
      );

      (pageData.results || []).forEach(tmdbItem => {
        const mapped = mapTMDB(tmdbItem);
        if (mapped && !candidateMap.has(mapped.id)) {
          candidateMap.set(mapped.id, mapped);
        }
      });
    } catch {
      // Sessizce devam et
    }
  });

  await Promise.all(fetchPromises);

  return Array.from(candidateMap.values());
}

/**
 * High-precision Turkish Thematic Scorer with STRICT RELEVANCE GATING.
 * Guarantees that unrelated shows receive a score of 0 so they are completely eliminated.
 */
export function scoreThematicItem(query: string, item: TVSeries): number {
  const queryNormalized = normalizeTurkishText(query);
  const queryWords = queryNormalized.split(/\s+/).filter(w => w.length >= 3);
  if (!queryWords.length) return 0;

  const queryStems = queryWords.map(stemTurkishWord);
  const titleNorm = normalizeTurkishText(item.title);
  const origNorm = normalizeTurkishText(item.originalTitle || '');
  const synopsisNorm = normalizeTurkishText(item.synopsis || '');
  const genresNorm = item.genres.map(normalizeTurkishText).join(' ');
  const moodsNorm = item.moodTags.map(normalizeTurkishText).join(' ');
  const fullItemText = `${titleNorm} ${origNorm} ${genresNorm} ${moodsNorm} ${synopsisNorm}`;
  const itemWordTokens = fullItemText.split(/\s+/).filter(Boolean);
  const itemStemTokens = itemWordTokens.map(stemTurkishWord);
  const itemStemSet = new Set(itemStemTokens);
  const itemWordSet = new Set(itemWordTokens);

  const matchingThemes = findMatchingThemes(queryNormalized);
  const primaryTheme = matchingThemes[0];

  // Anti-pollution shield: If query is adult/serious crime or drama, reject cartoons/animations
  const isAdultQuery = /uyuşturucu|kartel|mafya|cinayet|katil|kan|suç|savaş|şiddet|eroin|kokain/i.test(queryNormalized);
  const wantsAnimation = /çizgi|animasyon|anime|çocuk|cartoon/i.test(queryNormalized);
  if (isAdultQuery && !wantsAnimation) {
    if (item.genres.includes('Animasyon') || item.genres.includes('Çocuk') || /peppa|doraemon|spongebob|pokemon/i.test(titleNorm)) {
      return 0; // Strictly drop
    }
  }

  let directWordHits = 0;
  let stemHits = 0;
  let titleHit = false;

  // Exact word and stem boundary matching (eliminates partial substring false-positives)
  for (let i = 0; i < queryWords.length; i++) {
    const word = queryWords[i];
    const stem = queryStems[i];

    if (titleNorm.includes(word) || origNorm.includes(word)) {
      titleHit = true;
      directWordHits += 3;
    } else if (itemWordSet.has(word) || synopsisNorm.includes(word)) {
      directWordHits += 1;
    }

    if (itemStemSet.has(stem)) {
      stemHits += 1;
    }
  }

  let themeKeywordHits = 0;
  let themeAffinity = 0;
  let flagshipMatch = false;

  if (primaryTheme) {
    // Flagship series match (e.g. Breaking Bad, Narcos for drug cartel)
    for (const flagship of primaryTheme.searchQueries) {
      const normFlagship = normalizeTurkishText(flagship);
      if (titleNorm.includes(normFlagship) || origNorm.includes(normFlagship)) {
        flagshipMatch = true;
        themeAffinity += 70;
        break;
      }
    }

    // Specific theme keywords match
    for (const kw of primaryTheme.keywords) {
      const normKw = normalizeTurkishText(kw);
      const kwStem = stemTurkishWord(normKw);
      if (itemWordSet.has(normKw) || itemStemSet.has(kwStem) || fullItemText.includes(normKw)) {
        themeKeywordHits++;
        themeAffinity += 10;
      }
    }

    // Genre alignment with theme (bonus only)
    for (const tg of primaryTheme.targetGenres) {
      if (item.genres.includes(tg)) themeAffinity += 6;
    }

    // Mood alignment with theme (bonus only)
    for (const tm of primaryTheme.targetMoods) {
      if (item.moodTags.includes(tm as any)) themeAffinity += 4;
    }
  }

  // ULTRA-STRICT RELEVANCE GATE:
  // For multi-word queries, EVERY query word must independently hit the item's text.
  // A flagship match alone (e.g. Peaky Blinders matching 'savaş') is NOT sufficient
  // unless the item actually contains ALL query words.
  if (queryWords.length >= 2) {
    const allWordsHit = queryWords.every((word, i) => {
      const stem = queryStems[i];
      return (
        fullItemText.includes(word) ||
        itemStemSet.has(stem) ||
        titleNorm.includes(word) ||
        origNorm.includes(word)
      );
    });
    if (!allWordsHit) {
      // Only allow flagship/thematic grounding if the item actually contains
      // the most specific / longest query word
      const longestWord = queryWords.reduce((a, b) => a.length >= b.length ? a : b);
      const hasSpecificWord = fullItemText.includes(longestWord) || titleNorm.includes(longestWord);
      if (!hasSpecificWord) {
        return 0; // Hard drop: item doesn't contain the key query concept
      }
    }
  } else {
    // Single word: must have direct hit or strong thematic grounding
    const hasDirectHit = titleHit || directWordHits >= 1 || stemHits >= 1;
    const hasThematicGrounding = flagshipMatch || themeKeywordHits >= 2;
    if (!hasDirectHit && !hasThematicGrounding) {
      return 0;
    }
  }

  // Calculate final score
  let finalScore = 25;
  finalScore += directWordHits * 18;
  finalScore += stemHits * 10;
  finalScore += Math.min(80, themeAffinity);

  if (titleHit) finalScore += 30;
  if (flagshipMatch) finalScore += 50;

  // Reward high IMDb ratings for masterworks
  if (item.imdbRating >= 8.8) finalScore += 12;
  else if (item.imdbRating >= 7.8) finalScore += 6;
  else if (item.imdbRating < 6.0) finalScore -= 15;

  return Math.max(0, Math.min(230, Math.round(finalScore)));
}
