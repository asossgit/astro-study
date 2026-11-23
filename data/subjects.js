/* 分野・科目・レベル定義（要点ノートは data/notes-*.js） */
window.QB = { list: [], add(arr) { this.list.push(...arr); } };
window.NOTES = {};

window.FIELDS = [
  { id: 'hum', name: '一般教養｜人文科学' },
  { id: 'soc', name: '一般教養｜社会科学' },
  { id: 'stem', name: '基礎的専門（STEM）' },
];

window.LEVELS = [
  { name: '基礎', desc: '中学〜高校初級' },
  { name: '標準', desc: '公務員試験・共通テスト' },
  { name: '発展', desc: '難関大・専門基礎' },
];

window.SUBJECTS = [
  { id: 'jh', field: 'hum', name: '日本史', icon: '🏯', desc: '古代〜現代の政治・社会・文化' },
  { id: 'wh', field: 'hum', name: '世界史', icon: '🏛️', desc: '古代文明・中世・近代・現代の世界' },
  { id: 'geo', field: 'hum', name: '地理', icon: '🌏', desc: '気候・地形・産業・世界の国々' },
  { id: 'phi', field: 'hum', name: '思想・哲学', icon: '🦉', desc: '西洋・東洋・日本の思想家' },
  { id: 'art', field: 'hum', name: '文学・芸術', icon: '🎨', desc: '日本文学・西洋美術・音楽' },
  { id: 'pol', field: 'soc', name: '政治', icon: '🏛', desc: '日本国憲法・統治機構・国際政治' },
  { id: 'law', field: 'soc', name: '法律', icon: '⚖️', desc: '憲法・民法・刑法の基礎' },
  { id: 'eco', field: 'soc', name: '経済', icon: '💹', desc: 'ミクロ・マクロ・財政・金融' },
  { id: 'socy', field: 'soc', name: '社会・時事', icon: '📰', desc: '社会保障・環境・労働・国際社会' },
  { id: 'math', field: 'stem', name: '数学', icon: '📐', desc: '関数・図形・確率・微積分' },
  { id: 'chem', field: 'stem', name: '化学', icon: '⚗️', desc: '物質の構造・反応・有機化学' },
  { id: 'phys', field: 'stem', name: '物理', icon: '🧲', desc: '力学・電磁気・波動・熱・原子' },
  { id: 'bio', field: 'stem', name: '生物', icon: '🧬', desc: '細胞・遺伝・生理・生態' },
  { id: 'earth', field: 'stem', name: '地学', icon: '🌋', desc: '地球内部・岩石・気象・天文' },
  { id: 'space', field: 'stem', name: '宇宙開発', icon: '🚀', desc: '宇宙工学・宇宙環境・JAXAと国際協力' },
];
