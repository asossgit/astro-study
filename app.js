/* アストロ・スタディ — 宇宙飛行士選抜試験 学習アプリ */
(() => {
'use strict';

const S = window.SUBJECTS, F = window.FIELDS, LV = window.LEVELS;
const QS = window.QB.list;
const QMAP = Object.fromEntries(QS.map(q => [q.id, q]));
const SUBJ = Object.fromEntries(S.map(s => [s.id, s]));
const KEY = 'astro-study-v1';
const REVIEW_INTERVALS = [0, 1, 3, 7, 14]; // box1〜4 の復習間隔（日）。box5で卒業
const GRADUATE = 5;

/* ---------- 保存データ ---------- */
const defaults = () => ({
  settings: { daily: 20, reviewRatio: 0.3, levels: [1, 2, 3], weights: Object.fromEntries(S.map(s => [s.id, 1])), mockMinPerQ: 1.5 },
  rec: {},      // qid: {n, c, box, due, last, lastOk}
  days: {},     // 'YYYY-MM-DD': {n, c, ids:[]}
  mocks: [],    // {date, kind, n, c, sec, by:{sid:[c,n]}}
});
let D;
function load() {
  try { D = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch { D = defaults(); }
  const d = defaults();
  D.settings = Object.assign(d.settings, D.settings || {});
  D.settings.weights = Object.assign(d.settings.weights, D.settings.weights || {});
  D.rec ||= {}; D.days ||= {}; D.mocks ||= [];
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('保存できませんでした'); } }
load();

/* ---------- 日付 ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
function streak() {
  let n = 0, d = today();
  const goal = D.settings.daily;
  if (!((D.days[d]?.n || 0) >= goal)) d = addDays(d, -1); // 今日未達なら昨日から数える
  while ((D.days[d]?.n || 0) >= goal) { n++; d = addDays(d, -1); }
  return n;
}

/* ---------- ユーティリティ ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = (c, n) => n ? Math.round(c / n * 100) : 0;
const NUM = ['1', '2', '3', '4', '5'];
let toastTimer;
function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}
const fieldOf = sid => SUBJ[sid].field;
const chip = sid => `<span class="chip ${fieldOf(sid)}">${esc(SUBJ[sid].name)}</span>`;
const lvChip = l => `<span class="chip">${esc(LV[l - 1].name)}</span>`;

/* ---------- 学習ロジック ---------- */
function dueReviews() {
  const t = today();
  return QS.filter(q => { const r = D.rec[q.id]; return r && r.box > 0 && r.box < GRADUATE && r.due <= t; })
    .sort((a, b) => D.rec[a.id].due.localeCompare(D.rec[b.id].due));
}
function record(q, ok) {
  const r = D.rec[q.id] ||= { n: 0, c: 0, box: 0 };
  r.n++; if (ok) r.c++;
  r.last = today(); r.lastOk = ok;
  if (!ok) { r.box = 1; r.due = addDays(today(), REVIEW_INTERVALS[1]); }
  else if (r.box > 0) { r.box++; if (r.box < GRADUATE) r.due = addDays(today(), REVIEW_INTERVALS[r.box]); }
  const d = D.days[today()] ||= { n: 0, c: 0 };
  d.n++; if (ok) d.c++;
  save();
}
function weightedPick(pool, count) {
  // 科目ごとの重み付きでランダムに選ぶ（未学習を優先）
  const w = D.settings.weights, out = [], used = new Set();
  const groups = {};
  for (const q of pool) (groups[q.s] ||= []).push(q);
  for (const k in groups) {
    groups[k] = shuffle(groups[k]).sort((a, b) => (D.rec[a.id] ? 1 : 0) - (D.rec[b.id] ? 1 : 0));
  }
  while (out.length < count) {
    const keys = Object.keys(groups).filter(k => groups[k].length && (w[k] ?? 1) > 0);
    if (!keys.length) break;
    const total = keys.reduce((s, k) => s + (w[k] ?? 1), 0);
    let x = Math.random() * total, pick = keys[0];
    for (const k of keys) { x -= (w[k] ?? 1); if (x <= 0) { pick = k; break; } }
    const q = groups[pick].shift();
    if (!used.has(q.id)) { used.add(q.id); out.push(q); }
  }
  return out;
}
function buildMission() {
  const done = D.days[today()]?.n || 0;
  const remain = Math.max(0, D.settings.daily - done);
  if (!remain) return [];
  const due = dueReviews();
  const nRev = Math.min(due.length, Math.round(remain * D.settings.reviewRatio) || (due.length ? 1 : 0));
  const rev = due.slice(0, nRev);
  const lv = D.settings.levels;
  const revIds = new Set(rev.map(q => q.id));
  const pool = QS.filter(q => lv.includes(q.l) && !revIds.has(q.id));
  const fresh = weightedPick(pool, remain - rev.length);
  return shuffle([...rev, ...fresh]);
}

/* ---------- ルーター ---------- */
const views = {};
let session = null, timerId = null;
function setTitle(t, back) {
  $('#title').textContent = t;
  $('#backBtn').hidden = !back;
  $('#backBtn').onclick = back ? () => (typeof back === 'string' ? location.hash = back : back()) : null;
}
function route() {
  clearInterval(timerId);
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [name, ...args] = h.split('/');
  document.body.classList.toggle('quizmode', name === 'quiz');
  if (name !== 'quiz' && session && !session.finished) session = null;
  const tab = { home: 'home', browse: 'browse', subject: 'browse', mock: 'mock', stats: 'stats', notes: 'notes', note: 'notes', settings: 'home', review: 'home' }[name];
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const s = streak(); $('#streakBadge').textContent = s ? `🔥 ${s}日` : '';
  (views[name] || views.home)(...args.map(decodeURIComponent));
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const go = h => { if (location.hash === h) route(); else location.hash = h; };

/* ---------- ホーム ---------- */
views.home = () => {
  setTitle('アストロ・スタディ');
  const goal = D.settings.daily, done = D.days[today()]?.n || 0, c = D.days[today()]?.c || 0;
  const r = 48, circ = 2 * Math.PI * r, p = Math.min(1, done / goal);
  const due = dueReviews().length;
  const attempted = Object.keys(D.rec).length;
  const totalN = Object.values(D.rec).reduce((s, x) => s + x.n, 0), totalC = Object.values(D.rec).reduce((s, x) => s + x.c, 0);
  const w = D.settings.weights;
  const focus = S.filter(s => (w[s.id] ?? 1) >= 2);
  const doneAll = done >= goal;
  $('#view').innerHTML = `
    <div class="card">
      <div class="hero">
        <div class="ring">
          <svg viewBox="0 0 112 112" width="100%" height="100%"><circle cx="56" cy="56" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/>
          <circle cx="56" cy="56" r="${r}" fill="none" stroke="${doneAll ? 'var(--ok)' : 'var(--accent)'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - p)}"/></svg>
          <div class="lbl"><span class="big">${done}</span><span class="small">/ ${goal}問</span></div>
        </div>
        <div class="grow">
          <h3>${doneAll ? '本日のミッション達成！' : '本日のミッション'}</h3>
          <div class="muted">${doneAll ? `正答 ${c}/${done}（${pct(c, done)}%）。追加で学習もできます。` : `あと ${goal - done} 問。復習 ${Math.min(due, Math.round((goal - done) * D.settings.reviewRatio) || (due ? 1 : 0))} 問を含みます。`}</div>
          <div class="chips">${focus.length ? focus.map(s => `<span class="chip ${s.field}">重点：${esc(s.name)}</span>`).join('') : '<span class="chip">全分野バランス</span>'}</div>
        </div>
      </div>
      <div style="margin-top:14px">
        ${doneAll ? `<button class="btn sub" id="extra">追加で10問解く</button>` : `<button class="btn" id="start">ミッション開始</button>`}
      </div>
    </div>
    <div class="stat3">
      <div class="card"><b>${streak()}</b><span>連続達成日</span></div>
      <div class="card"><b>${attempted}<small style="font-size:13px;color:var(--mute)">/${QS.length}</small></b><span>挑戦した問題</span></div>
      <div class="card"><b>${totalN ? pct(totalC, totalN) + '%' : '—'}</b><span>通算正答率</span></div>
    </div>
    <h2>学習メニュー</h2>
    <button class="item" onclick="location.hash='#/review'"><div class="ic" style="background:var(--ng-soft)">🔁</div><div class="grow"><div class="t">間違えた問題の復習</div><div class="d">今日の復習 ${due} 問 ／ 復習リスト ${QS.filter(q => { const x = D.rec[q.id]; return x && x.box > 0 && x.box < GRADUATE; }).length} 問</div></div><span class="chev">›</span></button>
    <button class="item" onclick="location.hash='#/browse'"><div class="ic" style="background:var(--accent-soft)">📚</div><div class="grow"><div class="t">分野・レベル別に解く</div><div class="d">人文科学・社会科学・基礎的専門 15科目</div></div><span class="chev">›</span></button>
    <button class="item" onclick="location.hash='#/mock'"><div class="ic" style="background:var(--stem-soft)">⏱️</div><div class="grow"><div class="t">模擬試験</div><div class="d">時間制限つき・本番形式</div></div><span class="chev">›</span></button>
    <button class="item" onclick="location.hash='#/settings'"><div class="ic" style="background:var(--bg)">⚙️</div><div class="grow"><div class="t">ノルマ・出題設定</div><div class="d">1日 ${goal} 問 ／ 復習 ${Math.round(D.settings.reviewRatio * 100)}% ／ ${D.settings.levels.map(l => LV[l - 1].name).join('・')}</div></div><span class="chev">›</span></button>
  `;
  $('#start') && ($('#start').onclick = () => {
    const qs = buildMission();
    if (!qs.length) return toast('出題できる問題がありません。設定を確認してください');
    startSession(qs, { kind: 'mission', title: '本日のミッション' });
  });
  $('#extra') && ($('#extra').onclick = () => {
    const pool = QS.filter(q => D.settings.levels.includes(q.l));
    startSession(weightedPick(pool, 10), { kind: 'practice', title: '追加学習' });
  });
};

/* ---------- 分野別 ---------- */
views.browse = () => {
  setTitle('分野別に解く');
  let html = '';
  for (const f of F) {
    html += `<h2>${esc(f.name)}</h2>`;
    for (const s of S.filter(s => s.field === f.id)) {
      const qs = QS.filter(q => q.s === s.id);
      const tried = qs.filter(q => D.rec[q.id]);
      const n = tried.reduce((a, q) => a + D.rec[q.id].n, 0), c = tried.reduce((a, q) => a + D.rec[q.id].c, 0);
      html += `<button class="item" onclick="location.hash='#/subject/${s.id}'"><div class="ic ${s.field}">${s.icon}</div>
        <div class="grow"><div class="t">${esc(s.name)}</div><div class="d">${tried.length}/${qs.length}問に挑戦${n ? ` ・ 正答率 ${pct(c, n)}%` : ''}</div>
        <div class="bar"><i style="width:${pct(tried.length, qs.length)}%;background:var(--${s.field})"></i></div></div><span class="chev">›</span></button>`;
    }
  }
  $('#view').innerHTML = html;
};

views.subject = (sid) => {
  const s = SUBJ[sid]; if (!s) return go('#/browse');
  setTitle(s.name, '#/browse');
  const sel = new Set([1, 2, 3]);
  const render = () => {
    const qs = QS.filter(q => q.s === sid && sel.has(q.l));
    $('#view').innerHTML = `
      <div class="card"><div class="row"><div class="ic ${s.field}" style="width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px">${s.icon}</div>
      <div class="grow"><div style="font-weight:800;font-size:18px">${esc(s.name)}</div><div class="muted">${esc(s.desc)}</div></div></div></div>
      <h2>レベルを選ぶ（複数可）</h2>
      <div class="levels">${LV.map((l, i) => {
        const n = QS.filter(q => q.s === sid && q.l === i + 1).length;
        const t = QS.filter(q => q.s === sid && q.l === i + 1 && D.rec[q.id]).length;
        return `<div class="lvl ${sel.has(i + 1) ? 'on' : ''}" data-l="${i + 1}"><b>${esc(l.name)}</b><span>${esc(l.desc)}</span><div class="muted" style="margin-top:4px">${t}/${n}問</div></div>`;
      }).join('')}</div>
      <div style="margin-top:16px">
        <button class="btn" id="go10" ${qs.length ? '' : 'disabled'}>${Math.min(10, qs.length)}問 解く</button>
        <button class="btn sub" id="goAll" ${qs.length ? '' : 'disabled'}>全${qs.length}問 解く</button>
        <button class="btn ghost" id="goNew">まだ解いていない問題だけ（${qs.filter(q => !D.rec[q.id]).length}問）</button>
        <button class="btn ghost" onclick="location.hash='#/note/${sid}'">📖 要点ノートを読む</button>
      </div>`;
    document.querySelectorAll('.lvl').forEach(el => el.onclick = () => {
      const l = +el.dataset.l; sel.has(l) ? sel.delete(l) : sel.add(l); render();
    });
    const order = arr => arr.slice().sort((a, b) => a.l - b.l);
    $('#go10').onclick = () => startSession(order(shuffle(qs).slice(0, 10)), { kind: 'practice', title: s.name, back: `#/subject/${sid}` });
    $('#goAll').onclick = () => startSession(order(shuffle(qs)), { kind: 'practice', title: s.name, back: `#/subject/${sid}` });
    $('#goNew').onclick = () => { const n = qs.filter(q => !D.rec[q.id]); if (!n.length) return toast('すべて挑戦済みです'); startSession(order(shuffle(n)).slice(0, 10), { kind: 'practice', title: s.name, back: `#/subject/${sid}` }); };
  };
  render();
};

/* ---------- 復習 ---------- */
views.review = () => {
  setTitle('間違えた問題の復習', '#/');
  const due = dueReviews();
  const all = QS.filter(q => { const r = D.rec[q.id]; return r && r.box > 0 && r.box < GRADUATE; });
  const grad = QS.filter(q => D.rec[q.id]?.box >= GRADUATE).length;
  $('#view').innerHTML = `
    <div class="card"><div class="muted">間違えた問題は「翌日→3日後→7日後→14日後」と間隔をあけて再出題されます。4回続けて正解すると卒業（復習リストから外れます）。</div></div>
    <div class="stat3"><div class="card"><b style="color:var(--ng)">${due.length}</b><span>今日の復習</span></div><div class="card"><b>${all.length}</b><span>復習リスト</span></div><div class="card"><b style="color:var(--ok)">${grad}</b><span>卒業</span></div></div>
    <div style="margin-top:14px">
      <button class="btn" id="rv" ${due.length ? '' : 'disabled'}>今日の復習を解く（${due.length}問）</button>
      <button class="btn sub" id="rvAll" ${all.length ? '' : 'disabled'}>復習リストをすべて解く（${all.length}問）</button>
    </div>
    <h2>復習リスト</h2>
    ${all.length ? `<div class="card rlist">${all.map(q => `<div class="ri" data-id="${q.id}"><div class="grow">${chip(q.s)} ${lvChip(q.l)}<div style="margin-top:4px">${esc(q.q.slice(0, 60))}${q.q.length > 60 ? '…' : ''}</div></div><span class="muted">${D.rec[q.id].due <= today() ? '今日' : D.rec[q.id].due.slice(5).replace('-', '/')}</span></div>`).join('')}</div>`
      : `<div class="empty"><div class="em">✨</div>復習が必要な問題はありません</div>`}`;
  $('#rv').onclick = () => startSession(due, { kind: 'review', title: '復習', back: '#/review' });
  $('#rvAll').onclick = () => startSession(shuffle(all), { kind: 'review', title: '復習', back: '#/review' });
  document.querySelectorAll('.ri').forEach(el => el.onclick = () => startSession([QMAP[el.dataset.id]], { kind: 'review', title: '復習', back: '#/review' }));
};

/* ---------- 模擬試験 ---------- */
views.mock = () => {
  setTitle('模擬試験');
  let kind = 'all', n = 30;
  const render = () => {
    const pool = mockPool(kind);
    const nn = Math.min(n, pool.length), min = Math.round(nn * D.settings.mockMinPerQ);
    $('#view').innerHTML = `
      <div class="card">
        <div class="field"><label>出題範囲</label><div class="muted">本番の一般教養・基礎的専門試験をイメージした構成</div>
          <div class="seg" id="kind">${[['all', '総合'], ['gen', '一般教養'], ['stem', '基礎的専門']].map(([k, t]) => `<button data-k="${k}" class="${k === kind ? 'on' : ''}">${t}</button>`).join('')}</div></div>
        <div class="field"><label>問題数 <span class="val">${nn}</span> 問</label>
          <div class="seg" id="num">${[10, 20, 30, 50].map(x => `<button data-n="${x}" class="${x === n ? 'on' : ''}">${x}問</button>`).join('')}</div></div>
        <div class="field"><label>制限時間 <span class="val">${min}</span> 分</label><div class="muted">1問あたり ${D.settings.mockMinPerQ} 分（設定で変更可）。解答中は正誤を表示しません。</div></div>
        <button class="btn" id="mgo">試験開始</button>
      </div>
      <h2>過去の模試</h2>
      ${D.mocks.length ? `<div class="card rlist">${D.mocks.slice(-10).reverse().map(m => `<div class="ri"><div class="mark ${pct(m.c, m.n) >= 70 ? 'ok' : 'ng'}">${pct(m.c, m.n) >= 70 ? '✓' : '!'}</div><div class="grow"><b>${{ all: '総合', gen: '一般教養', stem: '基礎的専門' }[m.kind]}</b> ${m.c}/${m.n}問（${pct(m.c, m.n)}%）<div class="muted">${m.date} ・ ${Math.floor(m.sec / 60)}分${m.sec % 60}秒</div></div></div>`).join('')}</div>` : '<div class="empty"><div class="em">📝</div>まだ受験していません</div>'}`;
    document.querySelectorAll('#kind button').forEach(b => b.onclick = () => { kind = b.dataset.k; render(); });
    document.querySelectorAll('#num button').forEach(b => b.onclick = () => { n = +b.dataset.n; render(); });
    $('#mgo').onclick = () => {
      // 科目が偏らないよう、科目ごとに均等に抽出
      const by = {}; for (const q of shuffle(pool)) (by[q.s] ||= []).push(q);
      const out = []; const keys = shuffle(Object.keys(by));
      while (out.length < nn) { let added = false; for (const k of keys) { if (by[k].length && out.length < nn) { out.push(by[k].shift()); added = true; } } if (!added) break; }
      startSession(shuffle(out), { kind: 'mock', mockKind: kind, title: '模擬試験', limit: min * 60, back: '#/mock' });
    };
  };
  render();
};
function mockPool(kind) {
  return QS.filter(q => kind === 'all' || (kind === 'gen' ? fieldOf(q.s) !== 'stem' : fieldOf(q.s) === 'stem'));
}

/* ---------- 出題セッション ---------- */
function startSession(qs, opt) {
  session = { qs, i: 0, ans: [], order: [], opt, start: Date.now(), finished: false, picked: null };
  session.order = qs.map(q => q.ns ? [0, 1, 2, 3, 4].slice(0, q.c.length) : shuffle([...q.c.keys()]));
  go('#/quiz');
}
views.quiz = () => {
  if (!session) return go('#/');
  const s = session, q = s.qs[s.i], mock = s.opt.kind === 'mock';
  setTitle(s.opt.title, () => { if (confirm('中断しますか？（解答済みの問題は記録されます）')) { if (mock) { session = null; go(s.opt.back || '#/'); } else finish(); } });
  const answered = s.ans[s.i] !== undefined && !mock;
  const order = s.order[s.i];
  $('#view').innerHTML = `
    <div class="qhead"><div class="qnum">${s.i + 1} / ${s.qs.length}</div><div class="progress"><i style="width:${(s.i) / s.qs.length * 100}%"></i></div>${mock ? '<div class="timer" id="timer"></div>' : ''}</div>
    <div class="card">
      <div class="qmeta">${chip(q.s)} ${lvChip(q.l)}${!mock && D.rec[q.id]?.box > 0 && D.rec[q.id].box < GRADUATE ? '<span class="chip" style="background:var(--ng-soft);color:var(--ng)">復習</span>' : ''}</div>
      <div class="qtext">${esc(q.q)}</div>
      ${q.fig ? `<div class="fig">${q.fig}</div>` : ''}
      <div class="choices ${answered ? 'done' : ''}" id="choices">${order.map((ci, k) => {
        let cls = '';
        if (answered) { if (ci === q.a) cls = 'ok'; else if (ci === s.ans[s.i]) cls = 'ng'; }
        else if (mock && s.ans[s.i] === ci) cls = 'sel';
        return `<button class="choice ${cls}" data-ci="${ci}"><span class="no">${NUM[k]}</span><span>${esc(q.c[ci])}</span></button>`;
      }).join('')}</div>
      ${answered ? `<div class="verdict ${s.ans[s.i] === q.a ? 'ok' : 'ng'}">${s.ans[s.i] === q.a ? '◯ 正解' : '✕ 不正解'}<span class="muted" style="font-weight:600">正答は ${NUM[order.indexOf(q.a)]}</span></div>
        <div class="explain">${esc(q.e)}${q.efig ? `<div class="efig">${q.efig}</div>` : ''}</div>${noteBtn(q.s)}` : ''}
    </div>
    <div class="qfoot">${mock
      ? `<div class="grid2"><button class="btn ghost" id="prev" ${s.i ? '' : 'disabled'}>前へ</button><button class="btn" id="next">${s.i + 1 < s.qs.length ? '次へ' : '採点する'}</button></div>`
      : answered ? `<button class="btn" id="next">${s.i + 1 < s.qs.length ? '次の問題' : '結果を見る'}</button>` : ''}</div>`;
  document.querySelectorAll('.choice').forEach(b => b.onclick = () => {
    const ci = +b.dataset.ci;
    if (mock) { s.ans[s.i] = ci; document.querySelectorAll('.choice').forEach(x => x.classList.toggle('sel', x === b)); return; }
    if (answered) return;
    s.ans[s.i] = ci; record(q, ci === q.a); views.quiz();
    setTimeout(() => document.querySelector('.verdict')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  });
  $('#prev') && ($('#prev').onclick = () => { s.i--; views.quiz(); window.scrollTo(0, 0); });
  $('#next') && ($('#next').onclick = () => {
    if (s.i + 1 < s.qs.length) { s.i++; views.quiz(); window.scrollTo(0, 0); }
    else if (mock) { const left = s.qs.filter((_, k) => s.ans[k] === undefined).length; if (!left || confirm(`未解答が ${left} 問あります。採点しますか？`)) finish(); }
    else finish();
  });
  if (mock) {
    const tick = () => {
      const left = s.opt.limit - Math.floor((Date.now() - s.start) / 1000);
      const el = $('#timer'); if (!el) return;
      if (left <= 0) { clearInterval(timerId); toast('時間切れです'); finish(); return; }
      el.textContent = `残り ${Math.floor(left / 60)}:${pad(left % 60)}`; el.classList.toggle('warn', left < 60);
    };
    clearInterval(timerId); tick(); timerId = setInterval(tick, 1000);
  }
};
function finish() {
  const s = session; if (!s) return;
  clearInterval(timerId);
  s.finished = true;
  if (s.opt.kind === 'mock') {
    const by = {}; let c = 0;
    s.qs.forEach((q, k) => { const ok = s.ans[k] === q.a; if (ok) c++; (by[q.s] ||= [0, 0]); by[q.s][1]++; if (ok) by[q.s][0]++; record(q, ok); });
    D.mocks.push({ date: today(), kind: s.opt.mockKind, n: s.qs.length, c, sec: Math.round((Date.now() - s.start) / 1000), by });
    save();
  }
  location.hash = '#/result';
}
views.result = () => {
  const s = session; if (!s) return go('#/');
  const mock = s.opt.kind === 'mock';
  const done = s.qs.map((q, k) => ({ q, k, a: s.ans[k] })).filter(x => mock || x.a !== undefined);
  const c = done.filter(x => x.a === x.q.a).length;
  setTitle('結果', s.opt.back || '#/');
  const by = {}; done.forEach(x => { (by[x.q.s] ||= [0, 0]); by[x.q.s][1]++; if (x.a === x.q.a) by[x.q.s][0]++; });
  const goal = D.settings.daily, today_n = D.days[today()]?.n || 0;
  const p = pct(c, done.length);
  $('#view').innerHTML = `
    <div class="card score">
      <div class="muted">${esc(s.opt.title)}</div>
      <div class="pct" style="color:${p >= 70 ? 'var(--ok)' : p >= 50 ? 'var(--accent)' : 'var(--ng)'}">${p}<small style="font-size:24px">%</small></div>
      <div class="sub">${done.length}問中 ${c}問 正解${mock ? ` ・ ${Math.floor((Date.now() - s.start) / 60000)}分` : ''}</div>
      ${today_n >= goal ? `<div class="chip" style="margin-top:12px;display:inline-block;background:var(--ok-soft);color:var(--ok)">🎉 本日のノルマ ${goal}問 達成！</div>` : `<div class="muted" style="margin-top:10px">本日 ${today_n}/${goal} 問</div>`}
    </div>
    <h2>科目別</h2>
    <div class="card">${Object.entries(by).map(([sid, [cc, nn]]) => sbar(SUBJ[sid].name, cc, nn, `var(--${fieldOf(sid)})`)).join('')}</div>
    <h2>解答一覧（タップで解説）</h2>
    <div class="card rlist">${done.map(x => `<div class="ri" data-k="${x.k}"><div class="mark ${x.a === x.q.a ? 'ok' : 'ng'}">${x.a === x.q.a ? '◯' : '✕'}</div><div class="grow">${chip(x.q.s)} ${lvChip(x.q.l)}<div style="margin-top:4px">${esc(x.q.q.slice(0, 70))}${x.q.q.length > 70 ? '…' : ''}</div></div></div>`).join('')}</div>
    <button class="btn" onclick="location.hash='#/'">ホームへ</button>
    ${done.some(x => x.a !== x.q.a) ? `<button class="btn sub" id="retry">間違えた問題をもう一度</button>` : ''}`;
  document.querySelectorAll('.ri').forEach(el => el.onclick = () => showExplain(s.qs[+el.dataset.k], s.ans[+el.dataset.k], s.order[+el.dataset.k]));
  $('#retry') && ($('#retry').onclick = () => startSession(done.filter(x => x.a !== x.q.a).map(x => x.q), { kind: 'review', title: '解き直し', back: s.opt.back }));
};
function showExplain(q, a, order) {
  const back = location.hash;
  setTitle('解説', () => route());
  $('#view').innerHTML = `<div class="card">
    <div class="qmeta">${chip(q.s)} ${lvChip(q.l)}</div>
    <div class="qtext">${esc(q.q)}</div>${q.fig ? `<div class="fig">${q.fig}</div>` : ''}
    <div class="choices done">${order.map((ci, k) => `<div class="choice ${ci === q.a ? 'ok' : ci === a ? 'ng' : ''}"><span class="no">${NUM[k]}</span><span>${esc(q.c[ci])}</span></div>`).join('')}</div>
    <div class="verdict ${a === q.a ? 'ok' : 'ng'}">${a === undefined ? '未解答' : a === q.a ? '◯ 正解' : '✕ 不正解'}</div>
    <div class="explain">${esc(q.e)}${q.efig ? `<div class="efig">${q.efig}</div>` : ''}</div>${noteBtn(q.s)}</div>
    <button class="btn sub" id="bk">結果に戻る</button>`;
  $('#bk').onclick = () => route();
  window.scrollTo(0, 0);
}

/* ---------- 成績 ---------- */
function sbar(label, c, n, color) {
  return `<div class="sbar"><span>${esc(label)}</span><div class="track"><i style="width:${pct(c, n)}%;background:${color}"></i></div><span class="v ${n ? '' : 'na'}">${n ? pct(c, n) + '%' : '—'}</span></div>`;
}
views.stats = () => {
  setTitle('成績');
  // 直近14日
  const days = [...Array(14)].map((_, i) => addDays(today(), i - 13));
  const max = Math.max(D.settings.daily, ...days.map(d => D.days[d]?.n || 0));
  const W = 320, H = 140, bw = W / 14;
  const goalY = H - 20 - (D.settings.daily / max) * (H - 34);
  const chart = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="直近14日の解答数">
    ${days.map((d, i) => { const v = D.days[d]?.n || 0, c = D.days[d]?.c || 0; const h = (v / max) * (H - 34), hc = (c / max) * (H - 34);
      return `<rect x="${i * bw + 3}" y="${H - 20 - h}" width="${bw - 6}" height="${h}" rx="3" fill="#c9d6f6"/><rect x="${i * bw + 3}" y="${H - 20 - hc}" width="${bw - 6}" height="${hc}" rx="3" fill="var(--accent)"/>
      <text x="${i * bw + bw / 2}" y="${H - 6}" font-size="9" text-anchor="middle" fill="#8a94a6">${+d.slice(8)}</text>`; }).join('')}
    <line x1="0" x2="${W}" y1="${goalY}" y2="${goalY}" stroke="var(--hum)" stroke-dasharray="4 3" stroke-width="1.2"/>
    <text x="${W - 2}" y="${goalY - 4}" font-size="9" text-anchor="end" fill="var(--hum)">ノルマ ${D.settings.daily}</text></svg>`;
  let html = `<h2>直近14日</h2><div class="card">${chart}<div class="legend"><span><i style="background:var(--accent)"></i>正解</span><span><i style="background:#c9d6f6"></i>不正解</span><span><i style="background:var(--hum)"></i>ノルマ</span></div></div>`;
  // 科目別
  for (const f of F) {
    html += `<h2>${esc(f.name)}</h2><div class="card">`;
    for (const s of S.filter(s => s.field === f.id)) {
      const rs = QS.filter(q => q.s === s.id && D.rec[q.id]).map(q => D.rec[q.id]);
      html += sbar(s.name, rs.reduce((a, r) => a + r.c, 0), rs.reduce((a, r) => a + r.n, 0), `var(--${f.id})`);
    }
    html += `</div>`;
  }
  // レベル別
  html += `<h2>レベル別</h2><div class="card">${LV.map((l, i) => { const rs = QS.filter(q => q.l === i + 1 && D.rec[q.id]).map(q => D.rec[q.id]); return sbar(l.name, rs.reduce((a, r) => a + r.c, 0), rs.reduce((a, r) => a + r.n, 0), 'var(--accent)'); }).join('')}</div>`;
  // 苦手
  const weak = S.map(s => { const rs = QS.filter(q => q.s === s.id && D.rec[q.id]).map(q => D.rec[q.id]); const n = rs.reduce((a, r) => a + r.n, 0); return { s, n, p: pct(rs.reduce((a, r) => a + r.c, 0), n) }; })
    .filter(x => x.n >= 5).sort((a, b) => a.p - b.p).slice(0, 3);
  if (weak.length) html += `<h2>苦手科目（5問以上解答）</h2>${weak.map(x => `<button class="item" onclick="location.hash='#/subject/${x.s.id}'"><div class="ic ${x.s.field}">${x.s.icon}</div><div class="grow"><div class="t">${esc(x.s.name)}</div><div class="d">正答率 ${x.p}%</div></div><span class="chev">›</span></button>`).join('')}`;
  $('#view').innerHTML = html;
};

/* ---------- ノート ---------- */
const notesOf = sid => window.NOTES[sid] || [];
function noteCards(sid) {
  // 要点ノート本体（li は太字などのHTMLを含む信頼済みデータ）
  return notesOf(sid).map((n, i) => `<div class="card note" id="n-${sid}-${i}"><h3>${esc(n.h)}</h3>
    ${n.p ? `<p class="lead">${n.p}</p>` : ''}
    ${n.fig ? `<div class="fig">${n.fig}</div>` : ''}
    ${n.table ? `<div class="tscroll"><table class="ntable"><thead><tr>${n.table.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${n.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${n.li ? `<ul>${n.li.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}</div>`).join('');
}
function noteToc(sid, root) {
  return `<div class="toc">${notesOf(sid).map((n, i) => `<button data-to="n-${sid}-${i}">${esc(n.h)}</button>`).join('')}</div>`;
}
function bindToc(root) {
  root.querySelectorAll('.toc button').forEach(b => b.onclick = () => root.querySelector('#' + b.dataset.to)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
views.notes = () => {
  setTitle('要点ノート');
  let html = '<div class="card muted" style="margin-bottom:4px">各科目の頻出ポイントを表・図でまとめています。問題の解説画面からも、その科目のノートを開けます。</div>';
  for (const f of F) {
    html += `<h2>${esc(f.name)}</h2>`;
    for (const s of S.filter(s => s.field === f.id)) html += `<button class="item" onclick="location.hash='#/note/${s.id}'"><div class="ic ${s.field}">${s.icon}</div><div class="grow"><div class="t">${esc(s.name)}</div><div class="d">${notesOf(s.id).length}項目 ・ ${esc(s.desc)}</div></div><span class="chev">›</span></button>`;
  }
  $('#view').innerHTML = html;
};
views.note = (sid) => {
  const s = SUBJ[sid]; if (!s) return go('#/notes');
  setTitle(`${s.name} ノート`, '#/notes');
  $('#view').innerHTML = noteToc(sid) + noteCards(sid)
    + `<button class="btn" onclick="location.hash='#/subject/${sid}'">${esc(s.name)}の問題を解く</button>`;
  bindToc($('#view'));
};
/* 出題中でも学習を中断せずにノートを開くシート */
function openNoteSheet(sid) {
  const s = SUBJ[sid];
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(s.name)}の要点ノート"><div class="sheet-head"><b class="grow">${s.icon} ${esc(s.name)}の要点ノート</b><button class="sheet-x" aria-label="閉じる">✕</button></div>${noteToc(sid)}${noteCards(sid)}</div>`;
  document.body.appendChild(bg);
  document.body.style.overflow = 'hidden';
  const close = () => { bg.remove(); document.body.style.overflow = ''; };
  bg.onclick = e => { if (e.target === bg) close(); };
  bg.querySelector('.sheet-x').onclick = close;
  bindToc(bg);
  window.addEventListener('hashchange', close, { once: true });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-note]');
  if (b) openNoteSheet(b.dataset.note);
});
const noteBtn = sid => notesOf(sid).length ? `<button class="linkbtn" data-note="${sid}">📖 ${esc(SUBJ[sid].name)}の要点ノートを見る</button>` : '';

/* ---------- 設定 ---------- */
views.settings = () => {
  setTitle('ノルマ・出題設定', '#/');
  const st = D.settings;
  const wl = ['除外', '少なめ', '普通', '重点'];
  // 重み: 0=除外, 0.5=少なめ, 1=普通, 2=重点
  const wv = [0, 0.5, 1, 2];
  $('#view').innerHTML = `
    <div class="card">
      <div class="field"><label>1日のノルマ <span class="val" id="dv">${st.daily}</span> 問</label><div class="muted">毎日この数を解くとミッション達成。連続達成日数が記録されます。</div>
        <input type="range" id="daily" min="5" max="60" step="5" value="${st.daily}"></div>
      <div class="field"><label>復習の割合 <span class="val" id="rv">${Math.round(st.reviewRatio * 100)}</span> %</label><div class="muted">ノルマのうち「間違えた問題の復習」に充てる割合（復習がない日は新しい問題になります）</div>
        <input type="range" id="ratio" min="0" max="100" step="10" value="${Math.round(st.reviewRatio * 100)}"></div>
      <div class="field"><label>出題レベル</label><div class="muted">ミッションで出題するレベル</div>
        <div class="checks">${LV.map((l, i) => `<label><input type="checkbox" data-l="${i + 1}" ${st.levels.includes(i + 1) ? 'checked' : ''}>${esc(l.name)}</label>`).join('')}</div></div>
      <div class="field"><label>模試の1問あたり時間</label>
        <div class="seg" id="mm">${[1, 1.5, 2, 3].map(x => `<button data-m="${x}" class="${x === st.mockMinPerQ ? 'on' : ''}">${x}分</button>`).join('')}</div></div>
    </div>
    <h2>科目の配分（ミッションでの出題比率）</h2>
    <div class="card">${F.map(f => `<div class="muted" style="margin-top:6px;font-weight:700;color:var(--${f.id})">${esc(f.name)}</div>` + S.filter(s => s.field === f.id).map(s => `
      <div class="wrow"><span>${s.icon} ${esc(s.name)}</span><div class="seg" data-s="${s.id}">${wv.map((v, i) => `<button data-v="${v}" class="${(st.weights[s.id] ?? 1) === v ? 'on' : ''}">${wl[i]}</button>`).join('')}</div></div>`).join('')).join('')}
      <div class="row" style="margin-top:10px;gap:8px"><button class="btn ghost" id="wHum" style="padding:8px;font-size:13px">人文・社会を重点</button><button class="btn ghost" id="wStem" style="padding:8px;font-size:13px;margin:0">STEMを重点</button><button class="btn ghost" id="wReset" style="padding:8px;font-size:13px;margin:0">均等</button></div>
    </div>
    <h2>データ</h2>
    <div class="card">
      <div class="muted" style="margin-bottom:10px">学習記録はこの端末のブラウザ内に保存されます。機種変更やブラウザのデータ削除に備えて、ときどきバックアップしてください。</div>
      <button class="btn sub" id="exp">バックアップを書き出す</button>
      <button class="btn sub" id="imp">バックアップから復元</button>
      <input type="file" id="impf" accept="application/json,.json" hidden>
      <button class="btn danger" id="reset">学習記録をすべて消去</button>
    </div>
    <p class="muted" style="text-align:center">収録 ${QS.length} 問 ・ 問題は国家公務員試験等の出題形式を参考にしたオリジナル問題です</p>`;
  const set = (fn) => { fn(); save(); };
  $('#daily').oninput = e => { $('#dv').textContent = e.target.value; };
  $('#daily').onchange = e => set(() => st.daily = +e.target.value);
  $('#ratio').oninput = e => { $('#rv').textContent = e.target.value; };
  $('#ratio').onchange = e => set(() => st.reviewRatio = +e.target.value / 100);
  document.querySelectorAll('.checks input').forEach(c => c.onchange = () => {
    const l = [...document.querySelectorAll('.checks input')].filter(x => x.checked).map(x => +x.dataset.l);
    if (!l.length) { c.checked = true; return toast('1つ以上選んでください'); }
    set(() => st.levels = l);
  });
  document.querySelectorAll('#mm button').forEach(b => b.onclick = () => { set(() => st.mockMinPerQ = +b.dataset.m); views.settings(); });
  document.querySelectorAll('.seg[data-s] button').forEach(b => b.onclick = () => {
    const sid = b.parentElement.dataset.s; set(() => st.weights[sid] = +b.dataset.v);
    b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  });
  const bulk = fn => { set(() => S.forEach(s => st.weights[s.id] = fn(s))); views.settings(); toast('配分を変更しました'); };
  $('#wHum').onclick = () => bulk(s => s.field === 'stem' ? 0.5 : 2);
  $('#wStem').onclick = () => bulk(s => s.field === 'stem' ? 2 : 0.5);
  $('#wReset').onclick = () => bulk(() => 1);
  $('#exp').onclick = () => {
    const blob = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `astro-study-backup-${today()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#imp').onclick = () => $('#impf').click();
  $('#impf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j.settings || !j.rec) throw 0; if (!confirm('現在の記録を上書きして復元しますか？')) return; localStorage.setItem(KEY, JSON.stringify(j)); load(); toast('復元しました'); views.settings(); }
    catch { toast('バックアップファイルを読み込めませんでした'); }
  };
  $('#reset').onclick = () => { if (confirm('学習記録・設定をすべて消去します。元に戻せません。よろしいですか？')) { localStorage.removeItem(KEY); load(); toast('消去しました'); go('#/'); } };
};

/* ---------- 起動 ---------- */
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
