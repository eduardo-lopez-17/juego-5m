// Shared game data + scoring. Amounts are in $ millions.
window.G = (function () {
  const BUDGET = 5;
  const R1 = [
    { id: 'A', name: 'Payments app upgrade', desc: 'New version of a payments app that already has users.', p: 0.9, win: 1.3 },
    { id: 'B', name: 'AI data-center chip', desc: 'A new chip for AI data centers. Prototype works.', p: 0.5, win: 2.5 },
    { id: 'C', name: 'Phase 3 drug', desc: 'A new drug entering its final clinical trial.', p: 0.2, win: 6 }
  ];
  const R2 = [
    { id: 'F', name: 'Compact fusion', icon: '⚛️', desc: 'A fusion reactor the size of a shipping container. If it works: near-free energy. It has never been achieved.' },
    { id: 'N', name: 'Consumer brain chip', icon: '🧠', desc: 'An implant to control your phone with your mind. Works in monkeys. Regulators have not ruled yet.' },
    { id: 'M', name: 'Asteroid mining', icon: '☄️', desc: 'Robots that extract platinum from space. The tech exists on paper. The market does not exist yet.' }
  ];
  const CARDS = [
    { title: 'Japan and the EU ban consumer brain implants', m: { F: 3, N: 0, M: 1 } },
    { title: 'A lab achieves sustained ignition in a compact fusion reactor', m: { F: 8, N: 2, M: 0 } },
    { title: 'Giant platinum deposit found in Canada; platinum price falls 70%', m: { F: 1, N: 5, M: 0 } },
    { title: 'Big Tech buys the brain-chip startup for $40B', m: { F: 0.5, N: 10, M: 0 } }
  ];
  const PHASES = ['lobby', 'r1', 'r1reveal', 'r2a', 'news', 'r2b', 'final', 'lessons'];
  const PHASE_LABEL = {
    lobby: 'Join', r1: 'Round 1 · Risk', r1reveal: 'Round 1 · Results', r2a: 'Round 2 · First investment',
    news: 'Breaking news', r2b: 'Round 2 · Late investment', final: 'The future', lessons: 'What we learned'
  };

  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  const r2 = (x) => Math.round(x * 100) / 100;
  const money = (x) => {
    x = r2(x);
    if (Math.abs(x) < 1) return '$' + Math.round(x * 1000) + 'K';
    return '$' + (Number.isInteger(x) ? x : x.toFixed(2).replace(/0$/, '')) + 'M';
  };

  // Round 1 result for a player (needs state.r1Outcome)
  function round1(p, st) {
    const inv = (p && p.r1) || {};
    if (!st.r1Outcome) return null;
    let v = BUDGET - sum(inv);
    R1.forEach((x) => { v += (+inv[x.id] || 0) * (st.r1Outcome[x.id] ? x.win : 0); });
    return r2(v);
  }
  // Round 2 result. cardIdx overrides the drawn card ("what if" analysis).
  // bestLate=true ignores the player's real late bets and assumes the reserve was
  // used in the best way after the news (half multiplier, or kept as cash).
  function round2(p, st, cardIdx, bestLate) {
    const ci = cardIdx != null ? cardIdx : st.card;
    if (ci == null) return null;
    const m = CARDS[ci].m;
    const a = (p && p.r2a) || {}, b = bestLate ? {} : ((p && p.r2b) || {});
    let v = BUDGET - sum(a) - sum(b);
    if (bestLate) v *= Math.max(1, Math.max(...Object.values(m)) / 2);
    R2.forEach((x) => { v += (+a[x.id] || 0) * m[x.id] + (+b[x.id] || 0) * m[x.id] / 2; });
    return r2(v);
  }
  function reserve(p) { return r2(BUDGET - sum((p && p.r2a) || {})); }
  function total(p, st) { return r2((round1(p, st) ?? BUDGET) + (round2(p, st) ?? BUDGET)); }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return { BUDGET, R1, R2, CARDS, PHASES, PHASE_LABEL, sum, money, round1, round2, reserve, total, esc };
})();
