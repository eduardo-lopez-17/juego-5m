(function () {
  const { R1, R2, CARDS, PHASE_LABEL, money, round1, round2, reserve, total, sum, esc, BUDGET } = G;
  const qs = new URLSearchParams(location.search);
  const room = (qs.get('room') || 'live').replace(/[^\w-]/g, '').slice(0, 30) || 'live';
  const $ = (id) => document.getElementById(id);
  let data = { state: { phase: 'lobby' }, players: {} };
  let renderedKey = null, draft = null, draftField = null;

  const store = createStore(room, (d) => { data = d; render(); });
  // Demo mode: one player per tab (sessionStorage). Live: one per phone (localStorage).
  const box = store.demo ? sessionStorage : localStorage;
  const idKey = 'fund5m-id:' + room;
  let myId = box.getItem(idKey);
  if (!myId) { myId = 'p' + Math.random().toString(36).slice(2, 10); box.setItem(idKey, myId); }
  if (store.demo) $('banner').innerHTML = '<div class="banner">DEMO MODE · test player</div>';

  const me = () => (data.players || {})[myId] || {};

  function render() {
    const st = data.state || { phase: 'lobby' }, ph = st.phase || 'lobby', p = me();
    $('phase').textContent = PHASE_LABEL[ph];
    const key = [ph, p.name || '', st.card ?? '', JSON.stringify(st.r1Outcome || {}), ph === 'final' || ph === 'lessons' ? Object.keys(data.players || {}).length + JSON.stringify(p) : ''].join('|');
    tick();
    if (key === renderedKey) return; // don't rebuild the form while someone drags a slider
    renderedKey = key;
    const v = $('view');

    if (!p.name) {
      v.innerHTML = `<h1>The $5M Fund</h1><p class="muted">You are a venture capitalist. Pick a nickname to join.</p>
        <input type="text" id="nm" maxlength="18" placeholder="Your nickname" autocomplete="off"><button class="primary" id="join">Join</button>`;
      const join = () => { const n = $('nm').value.trim(); if (n) store.setPlayer(myId, { name: n, joined: Date.now() }); };
      $('join').onclick = join; $('nm').onkeydown = (e) => e.key === 'Enter' && join();
      return;
    }

    if (ph === 'lobby') {
      v.innerHTML = `<h1>You're in, ${esc(p.name)}!</h1><p class="muted">You'll get $5M in each round. The highest final balance wins.</p><p>Wait for the game to start…</p>`;
    } else if (ph === 'r1') {
      allocForm(v, 'r1', BUDGET, R1.map((x) => ({ id: x.id, name: `${x.id}. ${x.name}`, sub: `${Math.round(x.p * 100)}% success · x${x.win} if it works · x0 if not` })),
        '<h2>Round 1 · You know the odds</h2>', 'Kept as cash');
    } else if (ph === 'r1reveal') {
      const o = st.r1Outcome || {}, inv = p.r1 || {};
      v.innerHTML = `<h2>Round 1 result</h2><div class="bigmoney">${money(round1(p, st))}</div>
        <div class="card">${R1.map((x) => `<p>${x.id}. ${esc(x.name)}: ${money(+inv[x.id] || 0)} → <b class="${o[x.id] ? 'good' : 'bad'}">${o[x.id] ? 'success x' + x.win : 'failed'}</b></p>`).join('')}
        <p>Kept as cash: ${money(BUDGET - sum(inv))}</p></div><p class="muted">Get ready for round 2…</p>`;
    } else if (ph === 'r2a') {
      allocForm(v, 'r2a', BUDGET, R2.map((x) => ({ id: x.id, name: `${x.icon} ${x.name}`, sub: x.desc })),
        '<h2>Round 2 · Nobody knows the odds</h2><p class="muted">Invest part now. What you keep stays in reserve for later.</p>', 'Reserve');
    } else if (ph === 'news') {
      v.innerHTML = `<div class="newsbox"><small>BREAKING NEWS</small>${esc(CARDS[st.card ?? 0].title)}</div>
        <p>You kept <b>${money(reserve(p))}</b> in reserve. Get ready to decide what to do with it.</p>`;
    } else if (ph === 'r2b') {
      const res = reserve(p);
      if (res <= 0) {
        v.innerHTML = `<div class="newsbox"><small>THE NEWS</small>${esc(CARDS[st.card ?? 0].title)}</div><h2>You went all-in</h2><p class="muted">No reserve left to invest. Fingers crossed…</p>`;
      } else {
        allocForm(v, 'r2b', res, R2.map((x) => ({ id: x.id, name: `${x.icon} ${x.name}`, sub: 'Late money earns half the multiplier' })),
          `<div class="newsbox"><small>THE NEWS</small>${esc(CARDS[st.card ?? 0].title)}</div><h2>Invest your ${money(res)} reserve</h2>`, 'Kept as cash');
      }
    } else if (ph === 'final' || ph === 'lessons') {
      const ps = Object.values(data.players || {}).filter((x) => x.name);
      const t = total(p, st), rank = 1 + ps.filter((x) => total(x, st) > t).length;
      const m = CARDS[st.card ?? 0].m;
      v.innerHTML = `<h2>Your final balance</h2><div class="bigmoney">${money(t)}</div><p style="text-align:center">Rank <b>#${rank}</b> of ${ps.length}</p>
        <div class="card"><p>Round 1: <b>${money(round1(p, st) ?? BUDGET)}</b></p><p>Round 2: <b>${money(round2(p, st) ?? BUDGET)}</b></p>
        <p class="muted">${R2.map((x) => `${x.icon} x${m[x.id]}`).join(' · ')}</p></div>
        <p class="muted">Under uncertainty, the winner isn't who guesses best, but who keeps options open.</p>`;
    }
  }

  function allocForm(v, field, budget, items, header, keepLabel) {
    const saved = me()[field];
    if (draftField !== field) { draftField = field; draft = {}; items.forEach((it) => (draft[it.id] = saved ? +saved[it.id] || 0 : 0)); }
    v.innerHTML = `${header}<div class="alloc">${items.map((it) => `
      <div class="row"><div class="hd"><b>${esc(it.name)}</b><span id="v-${it.id}"></span></div><small>${esc(it.sub)}</small>
      <input type="range" min="0" max="${budget}" step="0.25" value="${draft[it.id]}" data-id="${it.id}"></div>`).join('')}
      <div class="keep"><span>${keepLabel}</span><b id="keep"></b></div>
      <button class="primary" id="go">${saved ? 'Update investment' : 'Confirm investment'}</button><div class="saved" id="saved">${saved ? 'Saved ✓ (you can still change it)' : ''}</div></div>`;
    const upd = () => { items.forEach((it) => ($('v-' + it.id).textContent = money(draft[it.id]))); $('keep').textContent = money(budget - sum(draft)); };
    v.querySelectorAll('input[type=range]').forEach((r) => {
      r.oninput = () => {
        const id = r.dataset.id, others = sum(draft) - draft[id];
        let val = +r.value; if (val + others > budget) { val = Math.max(0, budget - others); r.value = val; }
        draft[id] = Math.round(val * 100) / 100; $('saved').textContent = ''; upd();
      };
    });
    $('go').onclick = () => { store.setPlayer(myId, { [field]: Object.assign({}, draft) }); $('saved').textContent = 'Saved ✓ (you can still change it)'; $('go').textContent = 'Update investment'; };
    upd();
  }

  function tick() {
    const st = data.state || {};
    if (!st.timerEnd || !['r1', 'r2a', 'r2b'].includes(st.phase)) { $('timer').textContent = ''; return; }
    const s = Math.max(0, Math.ceil((st.timerEnd - Date.now()) / 1000));
    $('timer').textContent = s > 0 ? `⏱ ${s}s left` : "⏱ Time's up! Confirm now";
  }
  setInterval(tick, 500);
})();
