(function () {
  const { R1, R2, CARDS, PHASES, PHASE_LABEL, money, round1, round2, reserve, total, sum, esc, BUDGET } = G;
  const qs = new URLSearchParams(location.search);
  const room = (qs.get('room') || 'live').replace(/[^\w-]/g, '').slice(0, 30) || 'live';
  const playerUrl = new URL('play.html?room=' + encodeURIComponent(room), location.href).href;
  const $ = (id) => document.getElementById(id);
  let data = { state: { phase: 'lobby' }, players: {} };
  let shownPhase = null;

  const store = createStore(room, (d) => { data = d; render(); });
  const testMode = store.demo || qs.has('test');
  if (store.demo) $('banner').innerHTML = '<div class="banner">DEMO MODE · nothing is online yet. Open a player tab in this same browser to try it (or add test players). See README to go live.</div>';
  $('bots').hidden = !testMode;
  $('openPlayer').hidden = !store.demo;
  $('openPlayer').href = playerUrl;

  const TIMERS = { r1: 40, r2a: 40, r2b: 30 };

  function go(delta) {
    const st = data.state, i = PHASES.indexOf(st.phase || 'lobby');
    const next = PHASES[Math.max(0, Math.min(PHASES.length - 1, i + delta))];
    if (next === st.phase) return;
    const patch = { phase: next, timerEnd: TIMERS[next] ? Date.now() + TIMERS[next] * 1000 : null };
    if (next === 'r1reveal' && !st.r1Outcome) {
      patch.r1Outcome = {}; R1.forEach((x) => (patch.r1Outcome[x.id] = Math.random() < x.p));
    }
    if (next === 'news' && st.card == null) patch.card = Math.floor(Math.random() * CARDS.length);
    store.setState(patch);
  }
  $('next').onclick = () => go(1);
  $('back').onclick = () => go(-1);
  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });

  let resetArmed = null;
  $('reset').onclick = () => {
    if (resetArmed) { clearTimeout(resetArmed); resetArmed = null; $('reset').textContent = 'Reset game'; shownPhase = null; store.reset(); return; }
    $('reset').textContent = 'Click again to erase everything';
    resetArmed = setTimeout(() => { resetArmed = null; $('reset').textContent = 'Reset game'; }, 3000);
  };

  const NAMES = ['Kenji', 'Maria', 'Liu', 'Sofia', 'Tom', 'Aiko', 'Diego', 'Nina', 'Omar', 'Yuki', 'Lena', 'Raj', 'Ana', 'Ben'];
  $('bots').onclick = () => {
    const rand = (budget, ids) => { // random split, sometimes keep cash
      const w = ids.map(() => Math.random() ** 2); const s = w.reduce((a, b) => a + b, 0) || 1;
      const use = Math.random() < 0.35 ? budget : Math.round(budget * Math.random() * 4) / 4;
      const o = {}; let left = use;
      ids.forEach((id, k) => { const v = k === ids.length - 1 ? left : Math.min(left, Math.round(use * w[k] / s * 4) / 4); o[id] = Math.max(0, v); left -= o[id]; });
      return o;
    };
    for (let i = 0; i < 10; i++) {
      const id = 'bot' + Math.random().toString(36).slice(2, 8);
      const p = { name: NAMES[Math.floor(Math.random() * NAMES.length)] + ' (test)', joined: Date.now(),
        r1: rand(BUDGET, R1.map((x) => x.id)), r2a: rand(BUDGET, R2.map((x) => x.id)) };
      p.r2b = rand(reserve(p), R2.map((x) => x.id));
      store.setPlayer(id, p);
    }
  };

  // ---------- helpers ----------
  const players = () => Object.entries(data.players || {}).map(([id, p]) => Object.assign({ id }, p)).filter((p) => p.name);
  function board(list, key, title, n = 5) {
    const rows = list.filter((p) => key(p) != null).sort((a, b) => key(b) - key(a)).slice(0, n);
    if (!rows.length) return `<div class="board"><h2>${title}</h2><p class="muted">No players yet</p></div>`;
    return `<div class="board"><h2>${title}</h2><ol>${rows.map((p) => `<li><span>${esc(p.name)}</span><span>${money(key(p))}</span></li>`).join('')}</ol></div>`;
  }
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  function qrHtml() {
    try {
      const qr = qrcode(0, 'M'); qr.addData(playerUrl); qr.make();
      return qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
    } catch (e) { return '<p style="color:#111">QR unavailable</p>'; }
  }

  // ---------- render ----------
  function render() {
    const st = data.state || { phase: 'lobby' };
    const ph = st.phase || 'lobby';
    const ps = players();
    const fresh = ph !== shownPhase; shownPhase = ph;
    $('phase').textContent = PHASE_LABEL[ph];
    $('back').disabled = ph === 'lobby';
    $('next').textContent = { lobby: 'Start round 1 ▶', r1: 'Launch! ▶', r1reveal: 'Round 2 ▶', r2a: 'Reveal the news ▶', news: 'Late investment ▶', r2b: 'Reveal the future ▶', final: 'Lessons ▶', lessons: 'End' }[ph];
    $('next').disabled = ph === 'lessons';
    const field = { r1: 'r1', r2a: 'r2a', r2b: 'r2b' }[ph];
    $('counter').textContent = field ? `${ps.filter((p) => p[field]).length}/${ps.length} invested` : `${ps.length} players`;
    $('timer').hidden = !st.timerEnd || !TIMERS[ph];
    const v = $('view');

    if (ph === 'lobby') {
      $('title').textContent = 'The $5M Fund';
      v.innerHTML = `<div class="lobby">
        <div id="qr">${qrHtml()}</div>
        <div>
          <p class="lead" style="color:var(--ink);font-size:2vw">You are venture capitalists. You get <b>$5M</b> in each round.<br>The highest final balance wins.</p>
          <p class="lead" style="margin-top:1vw">Scan the QR code or open:</p>
          <div class="url">${esc(playerUrl)}</div>
          <div class="chips">${ps.map((p) => `<span class="chip">${esc(p.name)}</span>`).join('')}</div>
        </div></div>`;
    }

    if (ph === 'r1') {
      $('title').textContent = 'Round 1: you know the odds';
      v.innerHTML = `<p class="lead">Split your $5M. Money you don't invest is kept as is.</p><div class="grid3" style="margin-top:1.2vw">${R1.map((x) => `
        <div class="card"><h3>${x.id}. ${esc(x.name)}</h3><p>${esc(x.desc)}</p>
          <div class="stats"><div>Success<b>${Math.round(x.p * 100)}%</b></div><div>If it works<b>x${x.win}</b></div><div>If not<b>x0</b></div></div>
          <p style="margin-top:1vw">Expected value: <b style="color:var(--ink)">${(x.p * x.win).toFixed(2)}x</b></p></div>`).join('')}</div>`;
    }

    if (ph === 'r1reveal') {
      $('title').textContent = 'Round 1: results';
      const o = st.r1Outcome || {};
      v.innerHTML = `<div class="grid3">${R1.map((x) => `
        <div class="card"><h3>${x.id}. ${esc(x.name)}</h3><p>${Math.round(x.p * 100)}% chance · x${x.win}</p>
          <div class="verdict ${o[x.id] ? 'good' : 'bad'}" data-v>${o[x.id] ? 'SUCCESS x' + x.win : 'FAILED x0'}</div></div>`).join('')}</div>
        <div class="two" style="margin-top:1.6vw">${board(ps, (p) => round1(p, st), 'Top 5 after round 1')}
          <div class="board"><h2>This is risk</h2><p class="lead">We didn't know the outcome, but we knew the probabilities. Losing here was bad luck, not a bad decision.</p></div></div>`;
      const vs = v.querySelectorAll('[data-v]');
      if (fresh) vs.forEach((el, i) => setTimeout(() => el.classList.add('show'), 700 + i * 1100));
      else vs.forEach((el) => el.classList.add('show'));
    }

    if (ph === 'r2a') {
      $('title').textContent = 'Round 2: nobody knows the odds';
      v.innerHTML = `<p class="lead">New $5M. Invest part now and keep the rest in reserve. Probabilities? <b style="color:var(--accent)">Nobody knows.</b></p>
        <div class="grid3" style="margin-top:1.2vw">${R2.map((x) => `<div class="card"><div class="icon">${x.icon}</div><h3>${esc(x.name)}</h3><p>${esc(x.desc)}</p>
          <div class="stats"><div>Success<b>?</b></div><div>Payoff<b>?</b></div></div></div>`).join('')}</div>`;
    }

    if (ph === 'news') {
      $('title').textContent = 'Breaking news';
      const c = CARDS[st.card ?? 0];
      v.innerHTML = `<div class="newscard ${fresh ? '' : 'flipped'}" id="nc"><div class="inner">
          <div class="face front">BREAKING NEWS</div>
          <div class="face back"><small>BREAKING NEWS</small><div>${esc(c.title)}</div></div></div></div>
        <p class="lead" style="text-align:center">Nobody could have put a probability on this.</p>`;
      if (fresh) setTimeout(() => { const n = $('nc'); n && n.classList.add('flipped'); }, 1200);
    }

    if (ph === 'r2b') {
      $('title').textContent = 'Late investment';
      const c = CARDS[st.card ?? 0];
      v.innerHTML = `<div class="newscard flipped" style="height:12vw"><div class="inner"><div class="face back"><small>THE NEWS</small><div style="font-size:2vw">${esc(c.title)}</div></div></div></div>
        <p class="lead" style="text-align:center;font-size:2vw;color:var(--ink)">Now you can invest your reserve.<br><b style="color:var(--accent)">But the market already moved: late money earns half the multiplier.</b></p>`;
    }

    if (ph === 'final') {
      $('title').textContent = 'The future';
      const c = CARDS[st.card ?? 0];
      const r2s = ps.filter((p) => p.r2a || p.r2b);
      const loser = r2s.slice().sort((a, b) => round2(a, st) - round2(b, st))[0];
      v.innerHTML = `<div class="grid3">${R2.map((x) => `<div class="card"><div class="icon">${x.icon}</div><h3>${esc(x.name)}</h3>
          <div class="mult ${c.m[x.id] >= 1 ? 'good' : 'bad'}">x${c.m[x.id]}</div><p>Late money: x${c.m[x.id] / 2}</p></div>`).join('')}</div>
        <div class="two" style="margin-top:1.6vw">${board(ps, (p) => total(p, st), 'Final ranking (both rounds)')}
          <div class="board"><h2>Round 2 extremes</h2>${r2s.length ? `
            <p class="lead">Best round 2: <b style="color:var(--good)">${esc(r2s.slice().sort((a, b) => round2(b, st) - round2(a, st))[0].name)}</b> · ${money(Math.max(...r2s.map((p) => round2(p, st))))}</p>
            <p class="lead">Worst round 2: <b style="color:var(--bad)">${esc(loser.name)}</b> · ${money(round2(loser, st))}</p>
            <p class="lead">What did you do? 🎤</p>` : '<p class="muted">No round 2 investments</p>'}</div></div>`;
    }

    if (ph === 'lessons') {
      $('title').textContent = 'What we learned';
      const r2s = ps.filter((p) => p.r2a);
      const allIn = r2s.filter((p) => reserve(p) < 1), kept = r2s.filter((p) => reserve(p) >= 1);
      const avgRes = avg(r2s.map(reserve));
      const cell = (grp, ci) => { const a = avg(grp.map((p) => round2(p, st, ci, true))); return a == null ? '—' : money(a); };
      const worst = (grp) => (grp.length ? money(Math.min(...grp.flatMap((p) => CARDS.map((c, i) => round2(p, st, i, true))))) : '—');
      const best = (grp) => (grp.length ? money(Math.max(...grp.flatMap((p) => CARDS.map((c, i) => round2(p, st, i, true))))) : '—');
      v.innerHTML = `<div class="two">
        <div class="board"><h2>Same first bets, different news</h2>
          <p class="muted" style="font-size:1.1vw">Average round 2 result under each possible news card, assuming the reserve was used in the best way after the news.</p>
          <table class="whatif"><tr><th>News card</th><th>All-in (reserve &lt; $1M) · ${allIn.length}</th><th>Kept a reserve · ${kept.length}</th></tr>
          ${CARDS.map((c, i) => `<tr class="${i === st.card ? 'drawn' : ''}"><td>${esc(c.title)}${i === st.card ? ' ◀' : ''}</td><td class="n">${cell(allIn, i)}</td><td class="n">${cell(kept, i)}</td></tr>`).join('')}
          <tr><td><b>Best case, any player</b></td><td class="n good">${best(allIn)}</td><td class="n good">${best(kept)}</td></tr>
          <tr><td><b>Worst case, any player</b></td><td class="n bad">${worst(allIn)}</td><td class="n bad">${worst(kept)}</td></tr></table>
          <p class="lead" style="margin-top:1vw">On average the class kept <b style="color:var(--ink)">${avgRes == null ? '—' : money(avgRes)}</b> in reserve. All-in can win big, but some futures wipe you out. A reserve sets a floor.</p></div>
        <div class="board"><h2>Takeaways</h2><ol class="lessons">
          <li><b>Risk:</b> you can calculate. Losing is bad luck, not bad judgment.</li>
          <li><b>Knightian uncertainty:</b> there is no number to calculate. Going all-in means betting on a future nobody can price.</li>
          <li><b>Buy flexibility:</b> stage your investments and keep a reserve (real options). Don't try to guess the future.</li></ol></div></div>`;
    }
    tick();
  }

  function tick() {
    const st = data.state || {}; const el = $('timer');
    if (!st.timerEnd || !TIMERS[st.phase]) return;
    const s = Math.max(0, Math.ceil((st.timerEnd - Date.now()) / 1000));
    el.textContent = s > 0 ? `0:${String(s).padStart(2, '0')}` : "Time's up";
    el.classList.toggle('out', s === 0);
  }
  setInterval(tick, 250);
})();
